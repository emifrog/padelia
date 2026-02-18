import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripeClient = getStripe();
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        // Handle booking payment
        if (session.metadata?.type === 'booking') {
          const bookingId = session.metadata.booking_id;
          if (bookingId) {
            await supabase
              .from('bookings')
              .update({
                status: 'confirmed',
                stripe_payment_intent_id: session.payment_intent as string,
              })
              .eq('id', bookingId);
          }
          break;
        }

        // Handle tournament registration payment
        if (session.metadata?.type === 'tournament_registration') {
          const teamId = session.metadata.team_id;
          if (teamId) {
            await supabase
              .from('tournament_teams')
              .update({ payment_status: 'paid' })
              .eq('id', teamId);
          }
          break;
        }

        // Handle subscription payment
        if (userId && session.subscription) {
          const sub = await stripeClient.subscriptions.retrieve(
            session.subscription as string,
            { expand: ['items'] },
          );
          const periodEnd = sub.items.data[0]?.current_period_end ?? null;

          await supabase
            .from('profiles')
            .update({
              is_premium: true,
              stripe_customer_id: session.customer as string,
              premium_expires_at: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('stripe_payment_intent_id', paymentIntentId)
            .eq('status', 'confirmed');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const isActive = ['active', 'trialing'].includes(subscription.status);
        const periodEnd = subscription.items?.data?.[0]?.current_period_end ?? null;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              is_premium: isActive,
              premium_expires_at: isActive && periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              is_premium: false,
              premium_expires_at: null,
            })
            .eq('id', profile.id);
        }
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (error) {
    console.error(`[webhook] Error processing ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role client for webhook (no user context)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

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

  const supabase = getAdminClient();

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

        // Handle subscription payment
        if (userId && session.subscription) {
          const subResponse = await stripeClient.subscriptions.retrieve(
            session.subscription as string,
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = subResponse as any;
          const periodEnd = sub.current_period_end ?? sub.data?.current_period_end;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const charge = event.data.object as any;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const isActive = ['active', 'trialing'].includes(subscription.status);
        const periodEnd = subscription.current_period_end;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
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

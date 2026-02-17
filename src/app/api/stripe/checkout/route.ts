import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, PLANS } from '@/lib/stripe/config';
import { applyRateLimit, getRateLimitId } from '@/lib/api-utils';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(getRateLimitId(request, user.id), RATE_LIMITS.mutation, 'stripe:checkout');
    if (rateLimited) return rateLimited;

    const { plan } = await request.json() as { plan: string };

    if (plan !== 'premium_monthly' && plan !== 'premium_yearly') {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    const planConfig = PLANS[plan];

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile?.email ?? user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profil/abonnement?success=true`,
      cancel_url: `${appUrl}/profil/abonnement?cancelled=true`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe/checkout]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

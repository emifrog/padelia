import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/config';
import { applyRateLimit, getRateLimitId } from '@/lib/api-utils';
import { RATE_LIMITS } from '@/lib/rate-limit';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(getRateLimitId(request, user.id), RATE_LIMITS.mutation, 'booking:cancel');
    if (rateLimited) return rateLimited;

    const { booking_id } = await request.json() as { booking_id: string };
    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id requis' }, { status: 400 });
    }

    const admin = getAdmin();

    const { data: booking } = await admin
      .from('bookings')
      .select('id, booked_by, start_time, status, stripe_payment_intent_id, total_amount')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    if (booking.booked_by !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Seules les réservations confirmées peuvent être annulées' }, { status: 400 });
    }

    // Check refund eligibility: > 24h before start
    const startTime = new Date(booking.start_time);
    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart < 24) {
      return NextResponse.json(
        { error: 'Annulation impossible moins de 24h avant le début. Pas de remboursement.' },
        { status: 400 },
      );
    }

    // Issue Stripe refund
    if (booking.stripe_payment_intent_id) {
      try {
        await getStripe().refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
        });
      } catch (stripeErr) {
        console.error('[bookings/cancel] Stripe refund error:', stripeErr);
        return NextResponse.json({ error: 'Erreur de remboursement' }, { status: 500 });
      }
    }

    // Update booking status
    await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Annulé par le joueur',
      })
      .eq('id', booking_id);

    return NextResponse.json({ success: true, refunded: true });
  } catch (error) {
    console.error('[bookings/cancel]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

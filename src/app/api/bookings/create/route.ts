import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/config';
import { createBookingSchema } from '@/lib/validations/club';

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

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { court_id, date, start_time, duration_minutes } = parsed.data;
    const admin = getAdmin();

    // Fetch court + club info
    const { data: court } = await admin
      .from('courts')
      .select('id, club_id, name, hourly_rate, is_active, clubs (id, name, status, opening_hours)')
      .eq('id', court_id)
      .single();

    if (!court || !court.is_active) {
      return NextResponse.json({ error: 'Terrain non disponible' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const club = Array.isArray(court.clubs) ? court.clubs[0] : court.clubs as any;
    if (!club || club.status !== 'active') {
      return NextResponse.json({ error: 'Club non actif' }, { status: 404 });
    }

    // Calculate times
    const startDateTime = new Date(`${date}T${start_time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + duration_minutes * 60 * 1000);

    if (startDateTime <= new Date()) {
      return NextResponse.json({ error: 'Créneau dans le passé' }, { status: 400 });
    }

    // Calculate amount
    const hours = duration_minutes / 60;
    const hourlyRate = court.hourly_rate ?? 0;
    const totalAmount = Math.round(hourlyRate * hours * 100) / 100;

    // Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Get or create Stripe customer
    const { data: profile } = await admin
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

      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Insert booking first (pending)
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        court_id,
        booked_by: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending',
        total_amount: totalAmount,
      })
      .select('id')
      .single();

    if (bookingError) {
      // GIST exclusion constraint: double booking
      if (bookingError.code === '23P01') {
        return NextResponse.json(
          { error: 'Créneau déjà réservé' },
          { status: 409 },
        );
      }
      console.error('[bookings/create] Insert error:', bookingError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Create Stripe Checkout
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation ${court.name}`,
              description: `${club.name} — ${date} de ${start_time} à ${endDateTime.toTimeString().slice(0, 5)}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profil/reservations?success=true`,
      cancel_url: `${appUrl}/clubs/${club.id}/reserver?cancelled=true`,
      metadata: {
        type: 'booking',
        booking_id: booking.id,
        supabase_user_id: user.id,
      },
    });

    // Store payment intent reference
    if (session.payment_intent) {
      await admin
        .from('bookings')
        .update({ stripe_payment_intent_id: session.payment_intent as string })
        .eq('id', booking.id);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[bookings/create]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

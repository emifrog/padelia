import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe/config';
import { registerTeamSchema } from '@/lib/validations/tournament';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();
    const admin = getAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = registerTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { team_name, partner_id } = parsed.data;

    // Fetch tournament
    const { data: tournament } = await admin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi introuvable' }, { status: 404 });
    }

    if (tournament.status !== 'registration_open') {
      return NextResponse.json({ error: 'Les inscriptions ne sont pas ouvertes' }, { status: 400 });
    }

    if (tournament.team_count >= tournament.max_teams) {
      return NextResponse.json({ error: 'Tournoi complet' }, { status: 400 });
    }

    // Check captain not already registered
    const { data: existingTeam } = await admin
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('captain_id', user.id)
      .is('withdrawn_at', null)
      .maybeSingle();

    if (existingTeam) {
      return NextResponse.json({ error: 'Tu es deja inscrit a ce tournoi' }, { status: 400 });
    }

    // Check partner exists
    const { data: partner } = await admin
      .from('profiles')
      .select('id, full_name, level, level_score')
      .eq('id', partner_id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 400 });
    }

    // Check partner not already registered
    const { data: partnerTeam } = await admin
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', tournamentId)
      .contains('player_ids', [partner_id])
      .is('withdrawn_at', null)
      .maybeSingle();

    if (partnerTeam) {
      return NextResponse.json({ error: 'Ton partenaire est deja inscrit' }, { status: 400 });
    }

    // Check level requirements
    if (tournament.min_level || tournament.max_level) {
      const { data: userProfile } = await admin
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();

      const levels = ['debutant', 'initie', 'intermediaire', 'avance', 'expert', 'competition'];
      const userIdx = levels.indexOf(userProfile?.level ?? '');
      const partnerIdx = levels.indexOf(partner.level ?? '');
      const minIdx = tournament.min_level ? levels.indexOf(tournament.min_level) : 0;
      const maxIdx = tournament.max_level ? levels.indexOf(tournament.max_level) : levels.length - 1;

      if (userIdx < minIdx || userIdx > maxIdx) {
        return NextResponse.json({ error: 'Ton niveau ne correspond pas aux criteres du tournoi' }, { status: 400 });
      }
      if (partnerIdx < minIdx || partnerIdx > maxIdx) {
        return NextResponse.json({ error: 'Le niveau de ton partenaire ne correspond pas aux criteres' }, { status: 400 });
      }
    }

    const entryFee = Number(tournament.entry_fee);
    const isFree = entryFee === 0;

    // Insert team
    const { data: team, error: teamError } = await admin
      .from('tournament_teams')
      .insert({
        tournament_id: tournamentId,
        name: team_name,
        player_ids: [user.id, partner_id],
        captain_id: user.id,
        payment_status: isFree ? 'paid' : 'pending',
      })
      .select('id')
      .single();

    if (teamError) {
      // Unique constraint violation
      if (teamError.code === '23505') {
        return NextResponse.json({ error: 'Tu es deja inscrit' }, { status: 400 });
      }
      console.error('[tournaments/register] Insert error:', teamError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // If free, registration is complete
    if (isFree) {
      // Trigger notification to partner
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        await fetch(`${appUrl}/api/notifications/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tournament_registration',
            tournament_id: tournamentId,
            partner_id: partner_id,
            captain_name: 'ton partenaire',
          }),
        });
      } catch {
        // Non-blocking
      }
      return NextResponse.json({ success: true });
    }

    // Paid tournament — create Stripe Checkout
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

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Inscription ${tournament.name}`,
              description: `Equipe "${team_name}" — ${tournament.name}`,
            },
            unit_amount: Math.round(entryFee * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/tournois/${tournamentId}?success=true`,
      cancel_url: `${appUrl}/tournois/${tournamentId}/inscrire?cancelled=true`,
      metadata: {
        type: 'tournament_registration',
        team_id: team.id,
        tournament_id: tournamentId,
        supabase_user_id: user.id,
      },
    });

    // Store checkout session id
    await admin
      .from('tournament_teams')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', team.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[tournaments/register]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

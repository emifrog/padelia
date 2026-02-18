import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/config';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tournamentId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Fetch tournament
    const { data: tournament } = await admin
      .from('tournaments')
      .select('id, status, entry_fee, registration_deadline')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi introuvable' }, { status: 404 });
    }

    if (tournament.status === 'in_progress' || tournament.status === 'completed') {
      return NextResponse.json({ error: 'Impossible de se retirer d\'un tournoi en cours ou termine' }, { status: 400 });
    }

    // Find user's team
    const { data: team } = await admin
      .from('tournament_teams')
      .select('id, payment_status, stripe_checkout_session_id, player_ids')
      .eq('tournament_id', tournamentId)
      .eq('captain_id', user.id)
      .is('withdrawn_at', null)
      .maybeSingle();

    if (!team) {
      return NextResponse.json({ error: 'Equipe introuvable' }, { status: 404 });
    }

    // Process refund if paid and deadline not passed
    const entryFee = Number(tournament.entry_fee);
    if (entryFee > 0 && team.payment_status === 'paid' && team.stripe_checkout_session_id) {
      const deadlinePassed = tournament.registration_deadline
        ? new Date(tournament.registration_deadline) < new Date()
        : false;

      if (!deadlinePassed) {
        try {
          // Retrieve the checkout session to get the payment intent
          const session = await getStripe().checkout.sessions.retrieve(team.stripe_checkout_session_id);
          if (session.payment_intent) {
            await getStripe().refunds.create({
              payment_intent: session.payment_intent as string,
            });
          }
        } catch (err) {
          console.error('[tournaments/withdraw] Refund error:', err);
          // Continue with withdrawal even if refund fails
        }
      }
    }

    // Set withdrawn_at
    const { error: updateError } = await admin
      .from('tournament_teams')
      .update({ withdrawn_at: new Date().toISOString() })
      .eq('id', team.id);

    if (updateError) {
      console.error('[tournaments/withdraw] Update error:', updateError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Decrement team_count
    const { data: currentTournament } = await admin
      .from('tournaments')
      .select('team_count')
      .eq('id', tournamentId)
      .single();

    if (currentTournament) {
      await admin
        .from('tournaments')
        .update({ team_count: Math.max(0, currentTournament.team_count - 1) })
        .eq('id', tournamentId);
    }

    // Notify partner
    try {
      const partnerId = (team.player_ids ?? []).find((pid: string) => pid !== user.id);
      if (partnerId) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        await fetch(`${appUrl}/api/notifications/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tournament_update',
            tournament_id: tournamentId,
            user_ids: [partnerId],
            message: 'Votre equipe s\'est retiree du tournoi',
          }),
        });
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, message: 'Equipe retiree du tournoi' });
  } catch (error) {
    console.error('[tournaments/withdraw]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

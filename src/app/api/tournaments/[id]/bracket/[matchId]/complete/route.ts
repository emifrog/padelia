import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { completeBracketMatchSchema } from '@/lib/validations/tournament';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  try {
    const { id: tournamentId, matchId } = await params;
    const supabase = await createClient();
    const admin = getAdmin();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Verify organizer
    const { data: tournament } = await admin
      .from('tournaments')
      .select('id, organizer_id, status')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi introuvable' }, { status: 404 });
    }

    if (tournament.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    if (tournament.status !== 'in_progress') {
      return NextResponse.json({ error: 'Le tournoi n\'est pas en cours' }, { status: 400 });
    }

    // Validate body
    const body = await request.json();
    const parsed = completeBracketMatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { score_a, score_b, winner_team_id } = parsed.data;

    // Fetch bracket match
    const { data: bracketMatch } = await admin
      .from('tournament_brackets')
      .select('*')
      .eq('id', matchId)
      .eq('tournament_id', tournamentId)
      .single();

    if (!bracketMatch) {
      return NextResponse.json({ error: 'Match introuvable' }, { status: 404 });
    }

    if (bracketMatch.status === 'completed') {
      return NextResponse.json({ error: 'Match deja termine' }, { status: 400 });
    }

    // Verify winner is one of the teams
    if (winner_team_id !== bracketMatch.team_a_id && winner_team_id !== bracketMatch.team_b_id) {
      return NextResponse.json({ error: 'Le vainqueur doit etre une des deux equipes' }, { status: 400 });
    }

    // Update bracket match
    const { error: updateError } = await admin
      .from('tournament_brackets')
      .update({
        score_a,
        score_b,
        winner_team_id,
        status: 'completed',
      })
      .eq('id', matchId);

    if (updateError) {
      console.error('[bracket/complete] Update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise a jour' }, { status: 500 });
    }

    // Advance winner to next match
    if (bracketMatch.next_bracket_id) {
      const { data: nextMatch } = await admin
        .from('tournament_brackets')
        .select('id, team_a_id, team_b_id, round, position')
        .eq('id', bracketMatch.next_bracket_id)
        .single();

      if (nextMatch) {
        // Place winner: odd position → team_a, even position → team_b
        if (bracketMatch.position % 2 === 1) {
          await admin
            .from('tournament_brackets')
            .update({ team_a_id: winner_team_id })
            .eq('id', nextMatch.id);
        } else {
          await admin
            .from('tournament_brackets')
            .update({ team_b_id: winner_team_id })
            .eq('id', nextMatch.id);
        }
      }
    } else {
      // No next match → this is the final → tournament completed
      await admin
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournamentId);
    }

    return NextResponse.json({
      success: true,
      message: bracketMatch.next_bracket_id
        ? 'Score enregistre, vainqueur avance'
        : 'Finale terminee ! Tournoi termine.',
    });
  } catch (error) {
    console.error('[bracket/complete]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

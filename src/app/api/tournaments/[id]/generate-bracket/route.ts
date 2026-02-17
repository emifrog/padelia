import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { generateSingleEliminationBracket, type TeamSeed } from '@/lib/tournament/bracket-generator';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(
  _request: NextRequest,
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

    // Fetch tournament
    const { data: tournament } = await admin
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournoi introuvable' }, { status: 404 });
    }

    // Check organizer
    if (tournament.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Check status
    if (tournament.status !== 'registration_open' && tournament.status !== 'registration_closed') {
      return NextResponse.json({ error: 'Le tournoi doit etre en phase d\'inscription' }, { status: 400 });
    }

    // Fetch paid teams (not withdrawn)
    const { data: teams } = await admin
      .from('tournament_teams')
      .select('id, seed')
      .eq('tournament_id', tournamentId)
      .eq('payment_status', 'paid')
      .is('withdrawn_at', null)
      .order('seed', { ascending: true, nullsFirst: false });

    if (!teams || teams.length < 4) {
      return NextResponse.json({ error: 'Minimum 4 equipes payees requises' }, { status: 400 });
    }

    // Check no existing brackets
    const { data: existingBrackets } = await admin
      .from('tournament_brackets')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (existingBrackets && existingBrackets.length > 0) {
      return NextResponse.json({ error: 'Les brackets existent deja' }, { status: 400 });
    }

    // Generate bracket
    const teamSeeds: TeamSeed[] = teams.map((t) => ({
      team_id: t.id,
      seed: t.seed,
    }));

    const bracketEntries = generateSingleEliminationBracket(teamSeeds);

    // Insert bracket entries (first pass — without next_bracket_id)
    const insertData = bracketEntries.map((entry) => ({
      tournament_id: tournamentId,
      round: entry.round,
      position: entry.position,
      team_a_id: entry.team_a_id,
      team_b_id: entry.team_b_id,
      status: entry.status,
    }));

    const { data: insertedBrackets, error: insertError } = await admin
      .from('tournament_brackets')
      .insert(insertData)
      .select('id, round, position');

    if (insertError || !insertedBrackets) {
      console.error('[generate-bracket] Insert error:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la creation des brackets' }, { status: 500 });
    }

    // Build lookup map: round+position → bracket id
    const bracketMap = new Map<string, string>();
    for (const b of insertedBrackets) {
      bracketMap.set(`${b.round}-${b.position}`, b.id);
    }

    // Second pass: set next_bracket_id
    for (const entry of bracketEntries) {
      if (entry.next_bracket_position) {
        const currentId = bracketMap.get(`${entry.round}-${entry.position}`);
        const nextId = bracketMap.get(
          `${entry.next_bracket_position.round}-${entry.next_bracket_position.position}`,
        );

        if (currentId && nextId) {
          await admin
            .from('tournament_brackets')
            .update({ next_bracket_id: nextId })
            .eq('id', currentId);
        }
      }
    }

    // Update tournament status to in_progress
    await admin
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', tournamentId);

    return NextResponse.json({
      success: true,
      message: 'Bracket genere avec succes',
      total_matches: insertedBrackets.length,
    });
  } catch (error) {
    console.error('[generate-bracket]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateEloChanges, type EloPlayer, type MatchResult } from '@/lib/ranking';
import { calculateReliability } from '@/lib/ranking';
import { triggerMatchCompleted } from '@/lib/notifications/triggers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/matches/[id]/complete
 * Triggered after match result is saved.
 * Calculates ELO changes, updates player_stats, and updates profiles.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { id: matchId } = await context.params;
  const supabase = await createClient();

  // 1. Get match with scores
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .eq('status', 'completed')
    .single();

  if (matchError || !match) {
    return NextResponse.json({ error: 'Match not found or not completed' }, { status: 404 });
  }

  if (!match.winner_team || !match.score_team_a || !match.score_team_b) {
    return NextResponse.json({ error: 'Scores missing' }, { status: 400 });
  }

  // 2. Get participants with profiles
  const { data: participants } = await supabase
    .from('match_participants')
    .select(`
      player_id,
      team,
      status,
      profiles (
        level_score,
        total_matches,
        wins,
        losses,
        reliability_score
      )
    `)
    .eq('match_id', matchId)
    .eq('status', 'confirmed');

  if (!participants || participants.length === 0) {
    return NextResponse.json({ error: 'No participants' }, { status: 400 });
  }

  // 3. Parse scores into sets
  const scoresA = match.score_team_a.split('/').map(Number);
  const scoresB = match.score_team_b.split('/').map(Number);
  const sets = scoresA.map((a: number, i: number) => ({
    score_a: a,
    score_b: scoresB[i] ?? 0,
  }));

  const matchResult: MatchResult = {
    winner_team: match.winner_team,
    sets,
  };

  // 4. Build ELO players
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eloPlayers: EloPlayer[] = participants.map((p: any) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.player_id,
      level_score: profile?.level_score ?? 3.0,
      total_matches: profile?.total_matches ?? 0,
      team: p.team ?? 'A',
    };
  });

  // 5. Calculate ELO changes
  const eloResults = calculateEloChanges(eloPlayers, matchResult);

  // 6. Update each player
  for (const result of eloResults) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participant = participants.find((p: any) => p.player_id === result.player_id);
    const profile = participant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (Array.isArray((participant as any).profiles) ? (participant as any).profiles[0] : (participant as any).profiles)
      : null;

    const isWinner = participant?.team === match.winner_team;
    const currentWins = profile?.wins ?? 0;
    const currentLosses = profile?.losses ?? 0;
    const currentMatches = profile?.total_matches ?? 0;

    const newWins = isWinner ? currentWins + 1 : currentWins;
    const newLosses = isWinner ? currentLosses : currentLosses + 1;
    const newTotal = currentMatches + 1;
    const newWinRate = newTotal > 0 ? Math.round((newWins / newTotal) * 100 * 100) / 100 : 0;

    // Update reliability
    const newReliability = calculateReliability({
      current_score: profile?.reliability_score ?? 1.0,
      total_matches: currentMatches,
      event: 'played',
    });

    // Determine level enum from score
    const levelEnum = scoreToLevel(result.new_score);

    // Update profile
    await supabase
      .from('profiles')
      .update({
        level_score: result.new_score,
        level: levelEnum,
        total_matches: newTotal,
        wins: newWins,
        losses: newLosses,
        win_rate: newWinRate,
        reliability_score: newReliability,
      })
      .eq('id', result.player_id);

    // Insert player_stats record
    const totalSetsWon = sets.reduce(
      (acc: number, s: { score_a: number; score_b: number }) =>
        acc + (participant?.team === 'A' ? (s.score_a > s.score_b ? 1 : 0) : (s.score_b > s.score_a ? 1 : 0)),
      0,
    );
    const totalSetsLost = sets.length - totalSetsWon;

    // Find partner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partner = participants.find((p: any) =>
      p.player_id !== result.player_id && p.team === participant?.team,
    );

    await supabase.from('player_stats').insert({
      player_id: result.player_id,
      match_id: matchId,
      partner_id: partner?.player_id ?? null,
      was_winner: isWinner,
      sets_won: totalSetsWon,
      sets_lost: totalSetsLost,
      level_before: result.old_score,
      level_after: result.new_score,
      level_change: result.change,
    });
  }

  // 7. Notify all participants that match is completed
  triggerMatchCompleted(matchId).catch((err) => {
    console.error('[match/complete] Notification error:', err);
  });

  return NextResponse.json({
    success: true,
    results: eloResults,
  });
}

function scoreToLevel(score: number): string {
  if (score < 2.5) return 'debutant';
  if (score < 4.0) return 'initie';
  if (score < 5.5) return 'intermediaire';
  if (score < 7.0) return 'avance';
  if (score < 8.5) return 'expert';
  return 'competition';
}

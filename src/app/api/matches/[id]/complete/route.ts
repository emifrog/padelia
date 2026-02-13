import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateEloChanges, type EloPlayerInput, type EloMatchResult } from '@/lib/ranking/calculateElo'
import { calculateReliabilityChange } from '@/lib/ranking/reliability'
import { updateRankingsForPlayers } from '@/lib/ranking/updateRankings'

interface MatchPlayerRow {
  player_id: string
  team: number
  status: string
}

interface MatchSetRow {
  set_number: number
  team1_score: number
  team2_score: number
}

interface ProfileRow {
  id: string
  computed_level: number
  matches_played: number
  wins: number
  reliability_score: number
  city: string | null
}

interface PlayerStatsRow {
  id: string
  matches_played: number
  wins: number
  losses: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  win_streak: number
  best_streak: number
}

interface PartnerHistoryRow {
  matches_together: number
  wins_together: number
  matches_against: number
  wins_against: number
}

/**
 * POST /api/matches/[id]/complete
 *
 * Updates all player stats, ratings, partner history, and reliability
 * after a match is completed. Runs server-side with the service role key
 * to prevent client-side manipulation of ELO calculations.
 *
 * Requires authenticated user who is a participant in the match.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchId } = await params

  // Verify the caller is authenticated
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const accessToken = authHeader.replace('Bearer ', '')

  // Create a client with the user's token to verify identity
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } },
  )

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Token invalide.' }, { status: 401 })
  }

  // Use the service role key for all data mutations (trusted server-side)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Load match data
  const { data: match } = await supabase
    .from('matches')
    .select('id, winner_team, status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'completed' || !match.winner_team) {
    return NextResponse.json(
      { error: 'Match non terminé ou pas de vainqueur.' },
      { status: 400 },
    )
  }

  // 2. Load match players
  const { data: matchPlayersRaw } = await supabase
    .from('match_players')
    .select('player_id, team, status')
    .eq('match_id', matchId)

  const matchPlayers = (matchPlayersRaw || []) as MatchPlayerRow[]
  const acceptedPlayers = matchPlayers.filter((p) => p.status === 'accepted')

  // Verify the caller is a participant
  const isParticipant = acceptedPlayers.some((p) => p.player_id === user.id)
  if (!isParticipant) {
    return NextResponse.json(
      { error: 'Tu ne participes pas à ce match.' },
      { status: 403 },
    )
  }

  if (acceptedPlayers.length === 0) {
    return NextResponse.json({ error: 'Aucun joueur accepté.' }, { status: 400 })
  }

  // 3. Load sets
  const { data: setsRaw } = await supabase
    .from('match_sets')
    .select('set_number, team1_score, team2_score')
    .eq('match_id', matchId)
    .order('set_number')

  const sets = (setsRaw || []) as MatchSetRow[]

  // 4. Load player profiles
  const playerIds = acceptedPlayers.map((p) => p.player_id)
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, computed_level, matches_played, wins, reliability_score, city')
    .in('id', playerIds)

  const profiles = (profilesRaw || []) as ProfileRow[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // 5. Calculate ELO changes (server-side, tamper-proof)
  const eloPlayers: EloPlayerInput[] = acceptedPlayers.map((mp) => {
    const prof = profileMap.get(mp.player_id)
    return {
      playerId: mp.player_id,
      team: mp.team as 1 | 2,
      currentLevel: prof?.computed_level ?? 3.0,
      matchesPlayed: prof?.matches_played ?? 0,
    }
  })

  const eloResult: EloMatchResult = {
    sets: sets.map((s) => ({ team1: s.team1_score, team2: s.team2_score })),
    winnerTeam: match.winner_team as 1 | 2,
  }

  const eloChanges = calculateEloChanges(eloPlayers, eloResult)

  // 6. Compute total games won/lost
  let totalGamesTeam1 = 0
  let totalGamesTeam2 = 0
  let setsTeam1Won = 0
  let setsTeam2Won = 0
  for (const s of sets) {
    totalGamesTeam1 += s.team1_score
    totalGamesTeam2 += s.team2_score
    if (s.team1_score > s.team2_score) setsTeam1Won++
    else if (s.team2_score > s.team1_score) setsTeam2Won++
  }

  // 7. Batch load existing win streaks for reliability
  const { data: existingStatsRaw } = await supabase
    .from('player_stats')
    .select('player_id, win_streak')
    .in('player_id', playerIds)
    .eq('period', 'all_time')
    .eq('period_start', '2000-01-01')

  const existingStatsForReliability = new Map<string, number>()
  for (const row of (existingStatsRaw || []) as Array<{ player_id: string; win_streak: number }>) {
    existingStatsForReliability.set(row.player_id, row.win_streak ?? 0)
  }

  // 8. Update each player
  for (const change of eloChanges) {
    const prof = profileMap.get(change.playerId)
    if (!prof) continue

    const mp = acceptedPlayers.find((p) => p.player_id === change.playerId)
    if (!mp) continue

    const isWinner = mp.team === match.winner_team
    const playerTeam = mp.team as 1 | 2

    // Update reliability score
    const consecutiveCompleted = isWinner
      ? ((existingStatsForReliability.get(change.playerId) ?? 0) + 1)
      : 0
    const reliabilityDelta = calculateReliabilityChange(
      'completed',
      prof.reliability_score,
      consecutiveCompleted,
    )
    const newReliability = Math.max(0, Math.min(100, prof.reliability_score + reliabilityDelta))

    // Update profile
    await supabase
      .from('profiles')
      .update({
        computed_level: change.newLevel,
        matches_played: prof.matches_played + 1,
        wins: isWinner ? prof.wins + 1 : prof.wins,
        reliability_score: newReliability,
      })
      .eq('id', change.playerId)

    // Update match_players with rating change
    await supabase
      .from('match_players')
      .update({ rating_change: change.ratingChange })
      .eq('match_id', matchId)
      .eq('player_id', change.playerId)

    // Upsert all_time player_stats
    const setsWon = playerTeam === 1 ? setsTeam1Won : setsTeam2Won
    const setsLost = playerTeam === 1 ? setsTeam2Won : setsTeam1Won
    const gamesWon = playerTeam === 1 ? totalGamesTeam1 : totalGamesTeam2
    const gamesLost = playerTeam === 1 ? totalGamesTeam2 : totalGamesTeam1

    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('id, matches_played, wins, losses, sets_won, sets_lost, games_won, games_lost, win_streak, best_streak')
      .eq('player_id', change.playerId)
      .eq('period', 'all_time')
      .eq('period_start', '2000-01-01')
      .single()

    if (existingStats) {
      const current = existingStats as PlayerStatsRow
      const currentWinStreak = isWinner ? (current.win_streak || 0) + 1 : 0
      const currentBestStreak = Math.max(current.best_streak || 0, currentWinStreak)

      await supabase
        .from('player_stats')
        .update({
          matches_played: (current.matches_played || 0) + 1,
          wins: (current.wins || 0) + (isWinner ? 1 : 0),
          losses: (current.losses || 0) + (isWinner ? 0 : 1),
          sets_won: (current.sets_won || 0) + setsWon,
          sets_lost: (current.sets_lost || 0) + setsLost,
          games_won: (current.games_won || 0) + gamesWon,
          games_lost: (current.games_lost || 0) + gamesLost,
          win_streak: currentWinStreak,
          best_streak: currentBestStreak,
          level_at_period: change.newLevel,
        })
        .eq('id', current.id)
    } else {
      await supabase
        .from('player_stats')
        .insert({
          player_id: change.playerId,
          period: 'all_time',
          period_start: '2000-01-01',
          matches_played: 1,
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          sets_won: setsWon,
          sets_lost: setsLost,
          games_won: gamesWon,
          games_lost: gamesLost,
          win_streak: isWinner ? 1 : 0,
          best_streak: isWinner ? 1 : 0,
          level_at_period: change.newLevel,
        })
    }
  }

  // 9. Update partner history
  async function upsertPartnerHistory(
    playerId: string,
    partnerId: string,
    isTogether: boolean,
    isWin: boolean,
  ) {
    const { data: existing } = await supabase
      .from('partner_history')
      .select('matches_together, wins_together, matches_against, wins_against')
      .eq('player_id', playerId)
      .eq('partner_id', partnerId)
      .single()

    if (existing) {
      const row = existing as PartnerHistoryRow
      await supabase
        .from('partner_history')
        .update({
          matches_together: (row.matches_together || 0) + (isTogether ? 1 : 0),
          wins_together: (row.wins_together || 0) + (isTogether && isWin ? 1 : 0),
          matches_against: (row.matches_against || 0) + (!isTogether ? 1 : 0),
          wins_against: (row.wins_against || 0) + (!isTogether && isWin ? 1 : 0),
          last_played_at: new Date().toISOString(),
        })
        .eq('player_id', playerId)
        .eq('partner_id', partnerId)
    } else {
      await supabase.from('partner_history').insert({
        player_id: playerId,
        partner_id: partnerId,
        matches_together: isTogether ? 1 : 0,
        wins_together: isTogether && isWin ? 1 : 0,
        matches_against: !isTogether ? 1 : 0,
        wins_against: !isTogether && isWin ? 1 : 0,
        last_played_at: new Date().toISOString(),
      })
    }
  }

  for (const p of acceptedPlayers) {
    const isWinner = p.team === match.winner_team
    for (const other of acceptedPlayers) {
      if (other.player_id === p.player_id) continue
      const isTogether = p.team === other.team
      await upsertPartnerHistory(p.player_id, other.player_id, isTogether, isWinner)
    }
  }

  // 10. Update city rankings
  try {
    await updateRankingsForPlayers(playerIds, supabase)
  } catch {
    console.warn('Mise à jour des classements échouée (non bloquant)')
  }

  return NextResponse.json({ success: true })
}

import { createClient } from '@supabase/supabase-js'
import { calculateEloChanges, type EloPlayerInput, type EloMatchResult } from './calculateElo'
import { calculateReliabilityChange } from './reliability'
import { updateRankingsForPlayers } from './updateRankings'

/**
 * Update all player stats, ratings, partner history, and reliability
 * after a match is completed. Runs on the client side.
 *
 * This function:
 * 1. Calculates ELO changes for all players
 * 2. Updates profiles (computed_level, matches_played, wins)
 * 3. Updates match_players with rating_change
 * 4. Upserts player_stats for all_time period
 * 5. Upserts partner_history for teammates and opponents
 * 6. Updates reliability scores
 */

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

export async function updateAfterMatch(
  matchId: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken: string,
) {
  // Use a client with the user's auth token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  // 1. Load match data
  const { data: match } = await supabase
    .from('matches')
    .select('id, winner_team, status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'completed' || !match.winner_team) {
    throw new Error('Match non terminé ou pas de vainqueur.')
  }

  // 2. Load match players
  const { data: matchPlayersRaw } = await supabase
    .from('match_players')
    .select('player_id, team, status')
    .eq('match_id', matchId)

  const matchPlayers = (matchPlayersRaw || []) as unknown as MatchPlayerRow[]
  const acceptedPlayers = matchPlayers.filter((p) => p.status === 'accepted')

  if (acceptedPlayers.length === 0) return

  // 3. Load sets
  const { data: setsRaw } = await supabase
    .from('match_sets')
    .select('set_number, team1_score, team2_score')
    .eq('match_id', matchId)
    .order('set_number')

  const sets = (setsRaw || []) as unknown as MatchSetRow[]

  // 4. Load player profiles
  const playerIds = acceptedPlayers.map((p) => p.player_id)
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, computed_level, matches_played, wins, reliability_score, city')
    .in('id', playerIds)

  const profiles = (profilesRaw || []) as unknown as ProfileRow[]
  const profileMap = new Map(profiles.map((p) => [p.id, p]))

  // 5. Calculate ELO changes
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

  // 6. Compute total games won/lost per player
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

  // 7. Pre-load existing win streaks for reliability consistency bonus
  const existingStatsForReliability = new Map<string, number>()
  for (const playerId of playerIds) {
    const { data: statRow } = await supabase
      .from('player_stats')
      .select('win_streak')
      .eq('player_id', playerId)
      .eq('period', 'all_time')
      .eq('period_start', '2000-01-01')
      .single()

    if (statRow) {
      existingStatsForReliability.set(playerId, (statRow as Record<string, unknown>).win_streak as number ?? 0)
    }
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

    // Check for existing all_time stats
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', change.playerId)
      .eq('period', 'all_time')
      .eq('period_start', '2000-01-01')
      .single()

    if (existingStats) {
      const current = existingStats as Record<string, unknown>
      const currentWinStreak = isWinner ? ((current.win_streak as number) || 0) + 1 : 0
      const currentBestStreak = Math.max(
        (current.best_streak as number) || 0,
        currentWinStreak,
      )

      await supabase
        .from('player_stats')
        .update({
          matches_played: ((current.matches_played as number) || 0) + 1,
          wins: ((current.wins as number) || 0) + (isWinner ? 1 : 0),
          losses: ((current.losses as number) || 0) + (isWinner ? 0 : 1),
          sets_won: ((current.sets_won as number) || 0) + setsWon,
          sets_lost: ((current.sets_lost as number) || 0) + setsLost,
          games_won: ((current.games_won as number) || 0) + gamesWon,
          games_lost: ((current.games_lost as number) || 0) + gamesLost,
          win_streak: currentWinStreak,
          best_streak: currentBestStreak,
          level_at_period: change.newLevel,
        })
        .eq('id', current.id as string)
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
  const team1Players = acceptedPlayers.filter((p) => p.team === 1)
  const team2Players = acceptedPlayers.filter((p) => p.team === 2)

  // Helper to upsert partner history
  async function upsertPartnerHistory(
    playerId: string,
    partnerId: string,
    isTogether: boolean,
    isWin: boolean,
  ) {
    const { data: existing } = await supabase
      .from('partner_history')
      .select('*')
      .eq('player_id', playerId)
      .eq('partner_id', partnerId)
      .single()

    if (existing) {
      const row = existing as Record<string, unknown>
      await supabase
        .from('partner_history')
        .update({
          matches_together: ((row.matches_together as number) || 0) + (isTogether ? 1 : 0),
          wins_together: ((row.wins_together as number) || 0) + (isTogether && isWin ? 1 : 0),
          matches_against: ((row.matches_against as number) || 0) + (!isTogether ? 1 : 0),
          wins_against: ((row.wins_against as number) || 0) + (!isTogether && isWin ? 1 : 0),
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

  // For every pair of players, update partner history
  for (const p of acceptedPlayers) {
    const isWinner = p.team === match.winner_team

    for (const other of acceptedPlayers) {
      if (other.player_id === p.player_id) continue
      const isTogether = p.team === other.team
      await upsertPartnerHistory(p.player_id, other.player_id, isTogether, isWinner)
    }
  }

  // 10. Update city rankings for all participating players
  try {
    await updateRankingsForPlayers(playerIds, supabaseUrl, supabaseAnonKey, accessToken)
  } catch {
    // Rankings update is non-critical, don't fail the whole flow
    console.warn('Mise à jour des classements échouée (non bloquant)')
  }
}

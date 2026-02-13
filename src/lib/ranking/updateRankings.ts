import { type SupabaseClient } from '@supabase/supabase-js'
import { getTierFromLevel } from './calculateElo'

/**
 * Recalculate rankings for a given scope and value.
 * Called after match completion to update leaderboards.
 *
 * Rankings are based on computed_level (which reflects ELO).
 * Points = computed_level x 100 for sortable integer ranking.
 */

interface RankableProfile {
  id: string
  computed_level: number
  city: string | null
  matches_played: number
}

export async function updateRankingsForPlayers(
  playerIds: string[],
  supabase: SupabaseClient,
) {
  // Get profiles for these players
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, computed_level, city, matches_played')
    .in('id', playerIds)

  const profiles = (profilesRaw || []) as RankableProfile[]

  // Get unique cities from these players
  const cities = [...new Set(profiles.map((p) => p.city).filter(Boolean))] as string[]

  // Update city rankings for each city
  for (const city of cities) {
    // Get all players in this city with at least 1 match, sorted by computed_level
    const { data: playersRaw } = await supabase
      .from('profiles')
      .select('id, computed_level, matches_played')
      .eq('city', city)
      .gte('matches_played', 1)
      .order('computed_level', { ascending: false })
      .limit(200)

    const cityPlayers = (playersRaw || []) as RankableProfile[]

    // Batch upsert rankings instead of N+1 queries
    const rankingRows = cityPlayers.map((player, i) => ({
      player_id: player.id,
      scope: 'city' as const,
      scope_value: city,
      rank_position: i + 1,
      points: Math.round(player.computed_level * 100),
      tier: getTierFromLevel(player.computed_level),
      updated_at: new Date().toISOString(),
    }))

    if (rankingRows.length > 0) {
      await supabase
        .from('rankings')
        .upsert(rankingRows, {
          onConflict: 'player_id,scope,scope_value',
        })
    }
  }
}

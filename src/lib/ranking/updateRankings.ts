import { createClient } from '@supabase/supabase-js'
import { getTierFromLevel } from './calculateElo'

/**
 * Recalculate rankings for a given scope and value.
 * Called after match completion to update leaderboards.
 *
 * Rankings are based on computed_level (which reflects ELO).
 * Points = computed_level × 100 for sortable integer ranking.
 */

interface RankableProfile {
  id: string
  computed_level: number
  city: string | null
  matches_played: number
}

export async function updateRankingsForPlayers(
  playerIds: string[],
  supabaseUrl: string,
  supabaseAnonKey: string,
  accessToken: string,
) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  // Get profiles for these players
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, computed_level, city, matches_played')
    .in('id', playerIds)

  const profiles = (profilesRaw || []) as unknown as RankableProfile[]

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

    const cityPlayers = (playersRaw || []) as unknown as RankableProfile[]

    // Upsert ranking for each player
    for (let i = 0; i < cityPlayers.length; i++) {
      const player = cityPlayers[i]
      const points = Math.round(player.computed_level * 100)
      const tier = getTierFromLevel(player.computed_level)

      // Check existing ranking
      const { data: existing } = await supabase
        .from('rankings')
        .select('id')
        .eq('player_id', player.id)
        .eq('scope', 'city')
        .eq('scope_value', city)
        .single()

      if (existing) {
        await supabase
          .from('rankings')
          .update({
            rank_position: i + 1,
            points,
            tier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (existing as Record<string, unknown>).id as string)
      } else {
        await supabase.from('rankings').insert({
          player_id: player.id,
          scope: 'city',
          scope_value: city,
          rank_position: i + 1,
          points,
          tier,
        })
      }
    }
  }
}

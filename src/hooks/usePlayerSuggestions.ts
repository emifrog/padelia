'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore, type PlayerForMatching, type MatchScoreResult } from '@/lib/matching/calculateMatchScore'
import type { Profile } from '@/types'

interface SuggestedPlayer extends MatchScoreResult {
  profile: Profile
}

export function usePlayerSuggestions(limit = 10) {
  const [suggestions, setSuggestions] = useState<SuggestedPlayer[]>([])
  const [loading, setLoading] = useState(true)

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load current user's profile
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!myProfile) return

    // Load current user's availability
    const { data: mySlots } = await supabase
      .from('availability')
      .select('day_of_week, start_time, end_time')
      .eq('player_id', user.id)

    // Load other players
    const { data: otherProfiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(100)

    if (!otherProfiles || otherProfiles.length === 0) {
      setLoading(false)
      return
    }

    // Load their availability
    const otherIds = otherProfiles.map((p: Record<string, unknown>) => p.id as string)
    const { data: otherSlots } = await supabase
      .from('availability')
      .select('player_id, day_of_week, start_time, end_time')
      .in('player_id', otherIds)

    // Count overlapping slots
    interface SlotRow {
      player_id?: string
      day_of_week: number | null
      start_time: string
      end_time: string
    }

    function countOverlaps(playerId: string): number {
      if (!mySlots || !otherSlots) return 0
      const typedMySlots = mySlots as unknown as SlotRow[]
      const typedOtherSlots = otherSlots as unknown as SlotRow[]
      const playerSlots = typedOtherSlots.filter(
        (s) => s.player_id === playerId,
      )
      let count = 0
      for (const ms of typedMySlots) {
        for (const ps of playerSlots) {
          if (
            ms.day_of_week === ps.day_of_week &&
            ms.start_time < ps.end_time &&
            ms.end_time > ps.start_time
          ) {
            count++
          }
        }
      }
      return count
    }

    const meForMatching: PlayerForMatching = {
      id: myProfile.id as string,
      computed_level: myProfile.computed_level as number,
      preferred_side: myProfile.preferred_side as Profile['preferred_side'],
      latitude: myProfile.latitude as number | null,
      longitude: myProfile.longitude as number | null,
      reliability_score: myProfile.reliability_score as number,
      availabilitySlots: 0,
    }

    const scored: SuggestedPlayer[] = otherProfiles.map((p: Record<string, unknown>) => {
      const other: PlayerForMatching = {
        id: p.id as string,
        computed_level: p.computed_level as number,
        preferred_side: p.preferred_side as Profile['preferred_side'],
        latitude: p.latitude as number | null,
        longitude: p.longitude as number | null,
        reliability_score: p.reliability_score as number,
        availabilitySlots: countOverlaps(p.id as string),
      }
      const score = calculateMatchScore(meForMatching, other)
      return {
        ...score,
        profile: p as unknown as Profile,
      }
    })

    scored.sort((a, b) => b.totalScore - a.totalScore)
    setSuggestions(scored.slice(0, limit))
    setLoading(false)
  }, [limit])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  return { suggestions, loading, refresh: loadSuggestions }
}

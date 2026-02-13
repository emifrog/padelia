'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchCard } from './MatchCard'
import { Calendar } from 'lucide-react'

interface UpcomingMatch {
  id: string
  status: string
  match_type: string
  scheduled_at: string
  location_name: string | null
  min_level: number
  max_level: number
  is_public: boolean
  notes: string | null
  created_by: string
  player_count: number
  creator_name: string | null
}

export function UpcomingMatches() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch matches where user is a player
      const { data: playerEntries } = await supabase
        .from('match_players')
        .select('match_id')
        .eq('player_id', user.id)
        .eq('status', 'accepted')

      if (!playerEntries || playerEntries.length === 0) {
        setLoading(false)
        return
      }

      const matchIds = playerEntries.map((e: Record<string, unknown>) => e.match_id as string)

      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          match_players(id),
          creator:profiles!matches_created_by_fkey(full_name, username)
        `)
        .in('id', matchIds)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5)

      if (data) {
        setMatches(data.map((m: Record<string, unknown>) => {
          const players = m.match_players as Array<{ id: string }> | null
          const creator = m.creator as { full_name: string | null; username: string } | null
          return {
            id: m.id as string,
            status: m.status as string,
            match_type: m.match_type as string,
            scheduled_at: m.scheduled_at as string,
            location_name: m.location_name as string | null,
            min_level: m.min_level as number,
            max_level: m.max_level as number,
            is_public: m.is_public as boolean,
            notes: m.notes as string | null,
            created_by: m.created_by as string,
            player_count: players?.length ?? 0,
            creator_name: creator?.full_name || creator?.username || null,
          }
        }))
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null
  if (matches.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-secondary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mes prochains matchs
        </h3>
      </div>
      <div className="space-y-2">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            playerCount={match.player_count}
            creatorName={match.creator_name}
          />
        ))}
      </div>
    </div>
  )
}

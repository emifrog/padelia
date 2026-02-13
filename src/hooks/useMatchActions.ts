'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MatchPlayer {
  id: string
  player_id: string
  team: number
  side: string | null
  status: string
  rating_change: number | null
  profile: {
    username: string
    full_name: string | null
    level: number
    preferred_side: string
  } | null
}

interface UseMatchActionsParams {
  matchId: string
  currentUserId: string | null
  match: { id: string; status: string; min_level: number } | null
  players: MatchPlayer[]
  acceptedCount: number
  onRefresh: () => void
}

export function useMatchActions({
  matchId,
  currentUserId,
  match,
  players,
  acceptedCount,
  onRefresh,
}: UseMatchActionsParams) {
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [updatingStats, setUpdatingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    if (!currentUserId || !match) return
    setJoining(true)
    setError(null)

    try {
      const supabase = createClient()

      const team1Count = players.filter((p) => p.team === 1 && p.status === 'accepted').length
      const team2Count = players.filter((p) => p.team === 2 && p.status === 'accepted').length
      const assignedTeam = team1Count <= team2Count ? 1 : 2

      const { error: insertError } = await supabase.from('match_players').insert({
        match_id: match.id,
        player_id: currentUserId,
        team: assignedTeam,
        status: 'accepted',
      })

      if (insertError) throw new Error('Impossible de rejoindre ce match.')

      if (acceptedCount + 1 >= 4) {
        const allPlayers = [...players.filter((p) => p.status === 'accepted'), {
          player_id: currentUserId, team: assignedTeam, status: 'accepted',
          profile: null, id: '', side: null, rating_change: null,
        }]
        const t1 = allPlayers.filter((p) => p.team === 1)
        const t2 = allPlayers.filter((p) => p.team === 2)
        const avgT1 = t1.reduce((sum, p) => sum + (p.profile?.level ?? match.min_level), 0) / Math.max(t1.length, 1)
        const avgT2 = t2.reduce((sum, p) => sum + (p.profile?.level ?? match.min_level), 0) / Math.max(t2.length, 1)
        const balanceScore = Math.round(Math.max(0, 100 - Math.abs(avgT1 - avgT2) * 20))

        await supabase
          .from('matches')
          .update({ status: 'confirmed', balance_score: balanceScore })
          .eq('id', match.id)
      }

      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion au match.')
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave() {
    if (!currentUserId || !match) return
    setLeaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('match_players')
        .delete()
        .eq('match_id', match.id)
        .eq('player_id', currentUserId)

      if (deleteError) throw new Error('Impossible de quitter ce match.')

      if (match.status === 'confirmed') {
        await supabase
          .from('matches')
          .update({ status: 'pending' })
          .eq('id', match.id)
      }

      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait du match.')
    } finally {
      setLeaving(false)
    }
  }

  async function handleScoreComplete() {
    if (!match) return

    setUpdatingStats(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.access_token) {
        const res = await fetch(`/api/matches/${matchId}/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || 'Erreur serveur.')
        }
      }
    } catch (err) {
      console.error('Erreur mise à jour stats:', err)
    } finally {
      setUpdatingStats(false)
    }

    onRefresh()
  }

  return {
    joining,
    leaving,
    updatingStats,
    error,
    handleJoin,
    handleLeave,
    handleScoreComplete,
  }
}

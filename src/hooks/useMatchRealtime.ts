'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Subscribe to realtime changes on a specific match.
 * Calls onUpdate when the match or its players change.
 */
export function useMatchRealtime(matchId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()

    // Listen to match status changes
    const matchChannel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        () => onUpdate(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_players',
          filter: `match_id=eq.${matchId}`,
        },
        () => onUpdate(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(matchChannel)
    }
  }, [matchId, onUpdate])
}

/**
 * Subscribe to realtime match invitations for the current user.
 * Calls onInvitation when a new match_player row targets the user.
 */
export function useMatchInvitations(
  userId: string | null,
  onInvitation: (matchId: string) => void,
) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`invitations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_players',
          filter: `player_id=eq.${userId}`,
        },
        (payload) => {
          const matchId = payload.new?.match_id as string | undefined
          if (matchId) onInvitation(matchId)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onInvitation])
}

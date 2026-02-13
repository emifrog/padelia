'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toast'

/**
 * Listens to realtime changes on match_players for the current user.
 * Shows a toast notification when:
 * - Someone joins a match the user created
 * - Someone leaves a match the user created
 * - A match the user is in gets confirmed (4 players)
 */
export function useMatchInvitations(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Listen for new players joining matches where the user is a participant
    const channel = supabase
      .channel(`invitations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_players',
        },
        async (payload) => {
          const newPlayer = payload.new as Record<string, unknown>
          if (!newPlayer.match_id || newPlayer.player_id === userId) return

          // Check if the user is in this match
          const { data: myParticipation } = await supabase
            .from('match_players')
            .select('match_id')
            .eq('match_id', newPlayer.match_id as string)
            .eq('player_id', userId)
            .single()

          if (!myParticipation) return

          // Get the new player's name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', newPlayer.player_id as string)
            .single()

          const name = (profile as Record<string, unknown> | null)?.full_name || (profile as Record<string, unknown> | null)?.username || 'Un joueur'
          toast(`${name} a rejoint ton match !`, 'success')
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'match_players',
        },
        async (payload) => {
          const oldPlayer = payload.old as Record<string, unknown>
          if (!oldPlayer.match_id || oldPlayer.player_id === userId) return

          // Check if the user is in this match
          const { data: myParticipation } = await supabase
            .from('match_players')
            .select('match_id')
            .eq('match_id', oldPlayer.match_id as string)
            .eq('player_id', userId)
            .single()

          if (!myParticipation) return

          toast('Un joueur a quitté ton match.', 'info')
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const updatedMatch = payload.new as Record<string, unknown>
          const oldMatch = payload.old as Record<string, unknown>

          // Check if match status changed to confirmed
          if (oldMatch.status !== 'confirmed' && updatedMatch.status === 'confirmed') {
            // Check if user is in this match
            const { data: myParticipation } = await supabase
              .from('match_players')
              .select('match_id')
              .eq('match_id', updatedMatch.id as string)
              .eq('player_id', userId)
              .single()

            if (myParticipation) {
              toast('Match confirmé ! 4 joueurs inscrits.', 'success')
            }
          }

          // Check if match was completed
          if (oldMatch.status !== 'completed' && updatedMatch.status === 'completed') {
            const { data: myParticipation } = await supabase
              .from('match_players')
              .select('match_id')
              .eq('match_id', updatedMatch.id as string)
              .eq('player_id', userId)
              .single()

            if (myParticipation) {
              toast('Match terminé ! Tes stats ont été mises à jour.', 'info')
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}

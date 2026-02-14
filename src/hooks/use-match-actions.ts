'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useMatchActions() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  /** Rejoindre un match */
  async function joinMatch(matchId: string): Promise<boolean> {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Non connecté'); return false; }

      // Check not already participant
      const { data: existing } = await supabase
        .from('match_participants')
        .select('id')
        .eq('match_id', matchId)
        .eq('player_id', user.id)
        .single();

      if (existing) {
        toast.error('Tu participes déjà à ce match');
        return false;
      }

      // Check match is open and has space
      const { data: match } = await supabase
        .from('matches')
        .select('status, max_players')
        .eq('id', matchId)
        .single();

      if (!match || match.status !== 'open') {
        toast.error('Ce match n\'est plus ouvert');
        return false;
      }

      const { count } = await supabase
        .from('match_participants')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .in('status', ['confirmed', 'invited']);

      if ((count ?? 0) >= match.max_players) {
        toast.error('Ce match est complet');
        return false;
      }

      // Join
      const { error } = await supabase.from('match_participants').insert({
        match_id: matchId,
        player_id: user.id,
        role: 'player',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      });

      if (error) { toast.error('Erreur'); return false; }

      // Auto-update match status if full
      if ((count ?? 0) + 1 >= match.max_players) {
        await supabase
          .from('matches')
          .update({ status: 'full' })
          .eq('id', matchId);
      }

      toast.success('Tu as rejoint le match !');
      return true;
    } finally {
      setLoading(false);
    }
  }

  /** Quitter un match */
  async function leaveMatch(matchId: string): Promise<boolean> {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check is participant but not organizer
      const { data: participant } = await supabase
        .from('match_participants')
        .select('id, role')
        .eq('match_id', matchId)
        .eq('player_id', user.id)
        .single();

      if (!participant) {
        toast.error('Tu ne participes pas à ce match');
        return false;
      }

      if (participant.role === 'organizer') {
        toast.error('L\'organisateur ne peut pas quitter le match');
        return false;
      }

      const { error } = await supabase
        .from('match_participants')
        .delete()
        .eq('id', participant.id);

      if (error) { toast.error('Erreur'); return false; }

      // Re-open match if it was full
      await supabase
        .from('matches')
        .update({ status: 'open' })
        .eq('id', matchId)
        .eq('status', 'full');

      toast.success('Tu as quitté le match');
      return true;
    } finally {
      setLoading(false);
    }
  }

  /** Annuler un match (organizer only) */
  async function cancelMatch(matchId: string): Promise<boolean> {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('matches')
        .update({ status: 'cancelled' })
        .eq('id', matchId)
        .eq('organizer_id', user.id);

      if (error) { toast.error('Erreur'); return false; }

      toast.success('Match annulé');
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { joinMatch, leaveMatch, cancelMatch, loading };
}

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UseGroupActionsOptions {
  groupId: string;
  userId: string;
  onUpdate?: () => void;
}

export function useGroupActions({ groupId, userId, onUpdate }: UseGroupActionsOptions) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const joinGroup = useCallback(async () => {
    setLoading(true);
    try {
      // Check if already member
      const { data: existing } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        toast.info('Tu fais déjà partie de ce groupe');
        return;
      }

      // Check max members
      const { data: group } = await supabase
        .from('groups')
        .select('max_members, member_count')
        .eq('id', groupId)
        .single();

      if (group && group.member_count >= group.max_members) {
        toast.error('Ce groupe est complet');
        return;
      }

      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' });

      if (error) throw error;

      toast.success('Tu as rejoint le groupe !');
      onUpdate?.();
    } catch {
      toast.error('Erreur pour rejoindre le groupe');
    } finally {
      setLoading(false);
    }
  }, [groupId, userId, supabase, onUpdate]);

  const leaveGroup = useCallback(async () => {
    setLoading(true);
    try {
      // Check if admin (can't leave if sole admin)
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (membership?.role === 'admin') {
        const { data: otherAdmins } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)
          .eq('role', 'admin')
          .neq('user_id', userId);

        if (!otherAdmins || otherAdmins.length === 0) {
          toast.error('Tu es le seul admin. Nomme un autre admin avant de quitter.');
          return;
        }
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Tu as quitté le groupe');
      onUpdate?.();
    } catch {
      toast.error('Erreur pour quitter le groupe');
    } finally {
      setLoading(false);
    }
  }, [groupId, userId, supabase, onUpdate]);

  const deleteGroup = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Groupe supprimé');
      onUpdate?.();
    } catch {
      toast.error('Erreur de suppression');
    } finally {
      setLoading(false);
    }
  }, [groupId, supabase, onUpdate]);

  return { joinGroup, leaveGroup, deleteGroup, loading };
}

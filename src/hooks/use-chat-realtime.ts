'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'system' | 'match_invite';
  metadata: Record<string, unknown>;
  is_edited: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface UseChatRealtimeOptions {
  conversationId: string;
  userId: string;
}

export function useChatRealtime({ conversationId, userId }: UseChatRealtimeOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Load initial messages
  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          type,
          metadata,
          is_edited,
          created_at,
          profiles!messages_sender_id_fkey (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!cancelled && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((m: any) => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return {
            ...m,
            sender: profile ? {
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url,
            } : undefined,
          };
        });
        setMessages(mapped);
      }
      if (!cancelled) setLoading(false);
    }

    loadMessages();
    return () => { cancelled = true; };
  }, [conversationId, supabase]);

  // Subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Fetch sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', newMsg.sender_id)
            .single();

          const fullMsg: Message = {
            ...newMsg,
            sender: profile ? {
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url,
            } : undefined,
          };

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === fullMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
      type: 'text',
    });

    if (error) throw error;

    // Update last_read_at
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  }, [conversationId, userId, supabase]);

  // Mark as read
  const markAsRead = useCallback(async () => {
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  }, [conversationId, userId, supabase]);

  return { messages, loading, sendMessage, markAsRead };
}

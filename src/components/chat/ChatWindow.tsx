'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useChatRealtime } from '@/hooks/use-chat-realtime';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface Props {
  conversationId: string;
  userId: string;
  displayName: string;
  conversationType: string;
}

export default function ChatWindow({ conversationId, userId, displayName, conversationType }: Props) {
  const { messages, loading, loadingOlder, hasOlder, sendMessage, markAsRead, loadOlderMessages } = useChatRealtime({
    conversationId,
    userId,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);

  // Scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (isNearBottom || prevHeightRef.current === 0) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages]);

  // Preserve scroll position after loading older messages
  useEffect(() => {
    if (scrollRef.current && prevHeightRef.current > 0) {
      const newHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newHeight - prevHeightRef.current;
    }
  }, [loadingOlder]);

  // Detect scroll to top for loading older messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      if (el.scrollTop < 50 && hasOlder && !loadingOlder) {
        prevHeightRef.current = el.scrollHeight;
        loadOlderMessages();
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasOlder, loadingOlder, loadOlderMessages]);

  // Mark as read on mount
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col -mx-4 -mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/chat"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="text-[10px] text-muted-foreground">
            {conversationType === 'direct' ? 'Direct' : 'Groupe'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun message. Envoie le premier !
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {loadingOlder && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === userId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}

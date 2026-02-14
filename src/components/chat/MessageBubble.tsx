'use client';

import type { Message } from '@/hooks/use-chat-realtime';
import { cn } from '@/lib/utils';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isOwn && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-padel/10 text-xs font-bold text-green-padel">
          {message.sender?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}

      {/* Bubble */}
      <div className={cn('max-w-[75%] space-y-0.5', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && message.sender && (
          <p className="text-[10px] font-medium text-gray-400">
            {message.sender.full_name}
          </p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm',
            isOwn
              ? 'rounded-tr-sm bg-green-gradient text-white'
              : 'rounded-tl-sm bg-gray-100 text-navy',
          )}
        >
          {message.content}
        </div>
        <p className={cn(
          'text-[10px] text-gray-400',
          isOwn ? 'text-right' : 'text-left',
        )}>
          {time}
          {message.is_edited && ' · modifié'}
        </p>
      </div>
    </div>
  );
}

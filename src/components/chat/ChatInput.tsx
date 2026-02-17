'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface Props {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    if (!value.trim() || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setValue('');
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écrire un message..."
        aria-label="Écrire un message"
        disabled={disabled}
        rows={1}
        className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border bg-muted px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim() || sending || disabled}
        className="h-10 w-10 shrink-0 rounded-full"
        aria-label="Envoyer le message"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

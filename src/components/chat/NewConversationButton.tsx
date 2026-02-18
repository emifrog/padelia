'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Search, Loader2 } from 'lucide-react';

interface PlayerResult {
  id: string;
  full_name: string;
  username: string;
}

export default function NewConversationButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSearch(query: string) {
    setSearch(query);
    if (query.length < 2) { setResults([]); return; }

    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .eq('is_onboarded', true)
      .limit(10);

    // Filter out current user
    const { data: { user } } = await supabase.auth.getUser();
    setResults((data ?? []).filter((p) => p.id !== user?.id));
    setSearching(false);
  }

  async function startConversation(playerId: string) {
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if direct conversation already exists
    const { data: existingMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (existingMembers) {
      for (const em of existingMembers) {
        const { data: otherMember } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('conversation_id', em.conversation_id)
          .eq('user_id', playerId)
          .single();

        if (otherMember) {
          // Check it's a direct conversation
          const { data: conv } = await supabase
            .from('conversations')
            .select('id, type')
            .eq('id', em.conversation_id)
            .eq('type', 'direct')
            .single();

          if (conv) {
            setOpen(false);
            router.push(`/chat/${conv.id}`);
            return;
          }
        }
      }
    }

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'direct' })
      .select('id')
      .single();

    if (convError || !conv) {
      toast.error('Erreur de création');
      setCreating(false);
      return;
    }

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: playerId },
    ]);

    setOpen(false);
    router.push(`/chat/${conv.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Nouvelle conversation</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Chercher un joueur..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
              aria-label="Rechercher un joueur"
            />
          </div>

          <div className="space-y-1">
            {searching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {results.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => startConversation(player.id)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {player.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{player.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{player.username}</p>
                </div>
              </button>
            ))}
            {search.length >= 2 && !searching && results.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucun joueur trouvé</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

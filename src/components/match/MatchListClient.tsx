'use client';

import { useState, useCallback } from 'react';
import MatchCard, { type MatchCardData } from '@/components/match/MatchCard';
import { MATCH_TYPE_LABELS } from '@/lib/constants/match';
import type { MatchType } from '@/types';
import { Search, Swords, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const PAGE_SIZE = 15;

interface Props {
  matches: MatchCardData[];
}

export default function MatchListClient({ matches: initialMatches }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MatchType | ''>('');
  const [matches, setMatches] = useState<MatchCardData[]>(initialMatches);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMatches.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const lastMatch = matches[matches.length - 1];
      if (!lastMatch) return;

      const { data } = await supabase
        .from('matches')
        .select(`
          id, title, match_type, status, scheduled_at, duration_minutes,
          location_name, max_players, cost_per_player, organizer_id,
          profiles!matches_organizer_id_fkey ( full_name ),
          match_participants ( id, status )
        `)
        .in('status', ['open', 'full', 'confirmed', 'in_progress'])
        .gte('scheduled_at', new Date().toISOString())
        .gt('scheduled_at', lastMatch.scheduled_at)
        .order('scheduled_at', { ascending: true })
        .limit(PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newMatches: MatchCardData[] = data.map((m: any) => {
        const organizer = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const participants = (m.match_participants ?? []).filter(
          (p: { status: string }) => p.status === 'confirmed' || p.status === 'invited',
        );
        return {
          id: m.id,
          title: m.title,
          match_type: m.match_type,
          status: m.status,
          scheduled_at: m.scheduled_at,
          duration_minutes: m.duration_minutes,
          location_name: m.location_name,
          max_players: m.max_players,
          cost_per_player: m.cost_per_player,
          participant_count: participants.length,
          organizer_name: organizer?.full_name ?? null,
        };
      });

      setMatches((prev) => [...prev, ...newMatches]);
      if (newMatches.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [matches, loadingMore, hasMore]);

  const filtered = matches.filter((m) => {
    const matchesSearch =
      !search ||
      (m.title?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (m.location_name?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesType = !typeFilter || m.match_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Chercher un match, un lieu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Rechercher un match"
        />
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2" role="tablist" aria-label="Filtrer par type">
        <button
          type="button"
          role="tab"
          aria-selected={!typeFilter}
          onClick={() => setTypeFilter('')}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
            !typeFilter
              ? 'bg-navy text-white shadow-padel-md'
              : 'bg-white text-gray-500 shadow-padel'
          }`}
        >
          Tous
        </button>
        {(Object.entries(MATCH_TYPE_LABELS) as [MatchType, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={typeFilter === key}
            onClick={() => setTypeFilter(key)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-all ${
              typeFilter === key
                ? 'bg-navy text-white shadow-padel-md'
                : 'bg-white text-gray-500 shadow-padel'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}

          {/* Load more button */}
          {hasMore && !search && !typeFilter && (
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Charger plus
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Swords className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Aucun match trouvé</p>
          <p className="text-sm text-muted-foreground">
            Crée le premier ou modifie tes filtres
          </p>
        </div>
      )}
    </div>
  );
}

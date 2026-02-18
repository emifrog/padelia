'use client';

import { useState, useCallback } from 'react';
import TournamentCard, { type TournamentCardData } from '@/components/tournament/TournamentCard';
import { Search, Trophy, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { TournamentStatus } from '@/types';

const PAGE_SIZE = 12;

type Tab = 'upcoming' | 'in_progress' | 'past';

const TABS: { key: Tab; label: string; statuses: TournamentStatus[] }[] = [
  { key: 'upcoming', label: 'A venir', statuses: ['draft', 'registration_open', 'registration_closed'] },
  { key: 'in_progress', label: 'En cours', statuses: ['in_progress'] },
  { key: 'past', label: 'Termines', statuses: ['completed'] },
];

interface Props {
  tournaments: TournamentCardData[];
}

export default function TournamentListClient({ tournaments: initialTournaments }: Props) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [tournaments, setTournaments] = useState<TournamentCardData[]>(initialTournaments);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTournaments.length >= PAGE_SIZE);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const supabase = createClient();
      const lastItem = tournaments[tournaments.length - 1];
      if (!lastItem) return;

      const { data } = await supabase
        .from('tournaments')
        .select('id, name, status, format, location_name, starts_at, max_teams, team_count, entry_fee')
        .neq('status', 'cancelled')
        .lt('starts_at', lastItem.starts_at)
        .order('starts_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const newItems: TournamentCardData[] = data.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status as TournamentCardData['status'],
        format: t.format as TournamentCardData['format'],
        location_name: t.location_name,
        starts_at: t.starts_at,
        max_teams: t.max_teams,
        team_count: t.team_count,
        entry_fee: Number(t.entry_fee),
      }));

      setTournaments((prev) => [...prev, ...newItems]);
      if (newItems.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [tournaments, loadingMore, hasMore]);

  const tabStatuses = TABS.find((t) => t.key === activeTab)?.statuses ?? [];

  const filtered = tournaments.filter((t) => {
    // Tab filter
    if (!tabStatuses.includes(t.status)) return false;
    // Search filter
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.location_name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Chercher un tournoi, un lieu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="Rechercher un tournoi"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Filtrer les tournois">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}

          {hasMore && !search && (
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
          <Trophy className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Aucun tournoi</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Modifie ta recherche' : 'Aucun tournoi dans cette categorie'}
          </p>
        </div>
      )}
    </div>
  );
}

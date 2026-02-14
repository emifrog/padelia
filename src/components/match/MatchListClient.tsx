'use client';

import { useState } from 'react';
import MatchCard, { type MatchCardData } from '@/components/match/MatchCard';
import { MATCH_TYPE_LABELS } from '@/lib/constants/match';
import type { MatchType } from '@/types';
import { Search, Swords } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  matches: MatchCardData[];
}

export default function MatchListClient({ matches }: Props) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MatchType | ''>('');

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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Chercher un match, un lieu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Type filter pills (mockup: rounded-full, navy active, white inactive) */}
      <div className="flex gap-2">
        <button
          type="button"
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

'use client';

import { useState } from 'react';
import { usePlayerSuggestions } from '@/hooks/use-player-suggestions';
import PlayerSuggestionCard from '@/components/player/PlayerSuggestionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { LEVEL_LABELS } from '@/types';
import type { PlayerLevel } from '@/types';

export default function JoueursPage() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState<PlayerLevel | ''>('');
  const [distanceFilter, setDistanceFilter] = useState(30);
  const [visibleCount, setVisibleCount] = useState(10);

  const { suggestions, loading, error } = usePlayerSuggestions({
    maxDistance: distanceFilter,
    limit: 20,
  });

  // Client-side text filter
  const filtered = suggestions.filter((s) => {
    const matchesSearch =
      !search ||
      s.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.username.toLowerCase().includes(search.toLowerCase()) ||
      (s.profile.city?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesLevel = !levelFilter || s.profile.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy">Joueurs</h1>

      {/* Search + Filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Chercher un joueur, une ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-padel">
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">Niveau</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setLevelFilter('')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  !levelFilter
                    ? 'bg-navy text-white shadow-padel-md'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                Tous
              </button>
              {(Object.keys(LEVEL_LABELS) as PlayerLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelFilter(level)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    levelFilter === level
                      ? 'bg-navy text-white shadow-padel-md'
                      : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-navy">
              Distance max : <span className="text-green-padel">{distanceFilter} km</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(Number(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-green-padel" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-2 h-8 w-8 text-gray-300" />
          <p className="font-medium text-navy">Aucun joueur trouvé</p>
          <p className="text-sm text-gray-400">
            Essaie d&apos;élargir tes filtres
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {filtered.length} joueur{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
          </p>
          {filtered.slice(0, visibleCount).map((s) => (
            <PlayerSuggestionCard key={s.profile.id} suggestion={s} />
          ))}
          {visibleCount < filtered.length && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setVisibleCount((v) => v + 10)}
            >
              Charger plus ({filtered.length - visibleCount} restants)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { usePlayerSuggestions } from '@/hooks/use-player-suggestions';
import { Loader2, UserSearch } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SuggestionsSection() {
  const { suggestions, loading, error } = usePlayerSuggestions({ limit: 6 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-green-padel" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
        {error}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center">
        <UserSearch className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium">Aucune suggestion</p>
        <p className="text-xs text-muted-foreground">
          Complète ton profil pour de meilleures suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
      {suggestions.map((s) => {
        const { profile, score } = s;
        const distKm = score.breakdown.proximity > 0
          ? Math.round((1 - score.breakdown.proximity / 100) * 30)
          : null;

        return (
          <Link
            key={profile.id}
            href={`/joueurs/${profile.id}`}
            className="min-w-[140px] shrink-0 rounded-xl bg-white p-4 text-center shadow-padel"
          >
            {/* Avatar */}
            <div className="relative mx-auto mb-2 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-green-subtle text-[26px]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? 'Avatar'}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full object-cover"
                />
              ) : (
                profile.full_name?.charAt(0)?.toUpperCase() ?? '?'
              )}
              {/* Online dot (always show for suggestion relevance) */}
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-padel" />
            </div>

            <p className="truncate text-[14px] font-bold text-navy">
              {profile.full_name}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-gray-400">
              {profile.city ?? ''}
              {distKm != null && ` · ${distKm}km`}
            </p>

            {/* Match score badge */}
            <span className="mt-2 inline-block rounded-full bg-green-padel/10 px-2.5 py-0.5 text-[12px] font-bold text-green-padel">
              {score.total_score}% match
            </span>
          </Link>
        );
      })}
    </div>
  );
}

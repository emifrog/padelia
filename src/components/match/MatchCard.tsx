'use client';

import Link from 'next/link';
import { MATCH_TYPE_LABELS, MATCH_STATUS_LABELS } from '@/lib/constants/match';
import type { MatchType, MatchStatus } from '@/types';
import { MapPin, Clock } from 'lucide-react';

export interface MatchCardData {
  id: string;
  title: string | null;
  match_type: MatchType;
  status: MatchStatus;
  scheduled_at: string;
  duration_minutes: number;
  location_name: string | null;
  max_players: number;
  cost_per_player: number;
  participant_count?: number;
  organizer_name?: string;
}

interface Props {
  match: MatchCardData;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  friendly: 'bg-green-padel/15 text-green-padel',
  ranked: 'bg-amber-500/15 text-amber-600',
  tournament: 'bg-purple-500/15 text-purple-600',
};

export default function MatchCard({ match }: Props) {
  const date = new Date(match.scheduled_at);
  const isUpcoming = date > new Date();
  const playerCount = match.participant_count ?? 0;
  const fillPercent = Math.min((playerCount / match.max_players) * 100, 100);
  const isFull = playerCount >= match.max_players;

  return (
    <Link
      href={`/matchs/${match.id}`}
      className="block rounded-xl bg-white p-4 shadow-padel transition-transform active:scale-[0.98]"
    >
      {/* Top row: title + badge | price */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-navy">
              {match.title ?? 'Match'}
            </h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_BADGE_COLORS[match.match_type] ?? 'bg-gray-100 text-gray-600'}`}>
              {MATCH_TYPE_LABELS[match.match_type]}
            </span>
          </div>

          {/* Date + location */}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {date.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              {date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {match.location_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{match.location_name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        {match.cost_per_player > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-[18px] font-extrabold text-green-padel">{match.cost_per_player}€</p>
          </div>
        )}
      </div>

      {/* Bottom row: level/status + player count + progress bar */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[11px] font-semibold text-navy">
            {MATCH_STATUS_LABELS[match.status]}
          </span>
          <span className="text-[12px] text-gray-400">
            {playerCount}/{match.max_players} joueurs
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 w-20 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${isFull ? 'bg-amber-500' : 'bg-green-padel'}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* CTA hint */}
      {isUpcoming && match.status === 'open' && !isFull && (
        <div className="mt-3 rounded-lg bg-green-subtle px-3 py-1.5 text-center text-[12px] font-semibold text-green-padel">
          Place disponible — Rejoindre
        </div>
      )}
    </Link>
  );
}

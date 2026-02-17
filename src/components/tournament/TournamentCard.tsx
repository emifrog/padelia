'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, Users, Calendar, Trophy } from 'lucide-react';
import { TOURNAMENT_STATUS_COLORS, TOURNAMENT_FORMAT_LABELS } from '@/lib/constants/tournament';
import type { TournamentStatus, TournamentFormat } from '@/types';
import { TOURNAMENT_STATUS_LABELS } from '@/types';

export interface TournamentCardData {
  id: string;
  name: string;
  status: TournamentStatus;
  format: TournamentFormat;
  location_name: string | null;
  starts_at: string;
  max_teams: number;
  team_count: number;
  entry_fee: number;
}

interface Props {
  tournament: TournamentCardData;
}

export default memo(function TournamentCard({ tournament }: Props) {
  const dateStr = new Date(tournament.starts_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/tournois/${tournament.id}`}
      className="block rounded-xl bg-white p-4 shadow-padel transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <Trophy className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-bold text-navy">{tournament.name}</h3>

          <div className="mt-0.5 flex items-center gap-3 text-[12px] text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </span>
            {tournament.location_name && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{tournament.location_name}</span>
              </span>
            )}
          </div>

          {/* Teams + Fee */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {tournament.team_count}/{tournament.max_teams}
            </span>
            {tournament.entry_fee > 0 && (
              <span className="text-[12px] font-semibold text-green-padel">
                {tournament.entry_fee}EUR
              </span>
            )}
            {tournament.entry_fee === 0 && (
              <span className="text-[12px] font-medium text-gray-400">
                Gratuit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TOURNAMENT_STATUS_COLORS[tournament.status]}`}
        >
          {TOURNAMENT_STATUS_LABELS[tournament.status]}
        </span>
        <span className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          {TOURNAMENT_FORMAT_LABELS[tournament.format]}
        </span>
      </div>
    </Link>
  );
});

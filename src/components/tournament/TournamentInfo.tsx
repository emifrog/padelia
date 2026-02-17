'use client';

import { memo } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
} from 'lucide-react';
import { TOURNAMENT_FORMAT_LABELS, TOURNAMENT_STATUS_COLORS } from '@/lib/constants/tournament';
import { TOURNAMENT_STATUS_LABELS } from '@/types';
import type { Tournament } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  debutant: 'Debutant',
  initie: 'Initie',
  intermediaire: 'Intermediaire',
  avance: 'Avance',
  expert: 'Expert',
  competition: 'Competition',
};

interface Props {
  tournament: Tournament;
}

export default memo(function TournamentInfo({ tournament }: Props) {
  const startDate = new Date(tournament.starts_at).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const startTime = new Date(tournament.starts_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const deadlineStr = tournament.registration_deadline
    ? new Date(tournament.registration_deadline).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const levelRange =
    tournament.min_level || tournament.max_level
      ? `${LEVEL_LABELS[tournament.min_level ?? ''] ?? 'Tous'} — ${LEVEL_LABELS[tournament.max_level ?? ''] ?? 'Tous'}`
      : null;

  const items = [
    {
      icon: Calendar,
      label: 'Date',
      value: `${startDate} a ${startTime}`,
    },
    tournament.location_name && {
      icon: MapPin,
      label: 'Lieu',
      value: tournament.location_name,
    },
    {
      icon: Trophy,
      label: 'Format',
      value: TOURNAMENT_FORMAT_LABELS[tournament.format],
    },
    {
      icon: Users,
      label: 'Equipes',
      value: `${tournament.team_count}/${tournament.max_teams}`,
    },
    {
      icon: DollarSign,
      label: 'Inscription',
      value: tournament.entry_fee > 0 ? `${tournament.entry_fee}EUR par equipe` : 'Gratuit',
    },
    deadlineStr && {
      icon: Clock,
      label: 'Cloture inscriptions',
      value: deadlineStr,
    },
    levelRange && {
      icon: BarChart3,
      label: 'Niveau',
      value: levelRange,
    },
    tournament.prize_description && {
      icon: Trophy,
      label: 'Prix',
      value: tournament.prize_description,
    },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <div className="space-y-3">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-semibold ${TOURNAMENT_STATUS_COLORS[tournament.status]}`}
        >
          {TOURNAMENT_STATUS_LABELS[tournament.status]}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-padel"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
              <item.icon className="h-4.5 w-4.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                {item.label}
              </p>
              <p className="text-[14px] font-semibold text-navy">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      {tournament.description && (
        <div className="rounded-xl bg-white p-4 shadow-padel">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            Description
          </p>
          <p className="mt-1 whitespace-pre-line text-[14px] text-gray-600">
            {tournament.description}
          </p>
        </div>
      )}

      {/* Rules */}
      {tournament.rules && (
        <div className="rounded-xl bg-white p-4 shadow-padel">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
              Reglement
            </p>
          </div>
          <p className="mt-1 whitespace-pre-line text-[14px] text-gray-600">
            {tournament.rules}
          </p>
        </div>
      )}
    </div>
  );
});

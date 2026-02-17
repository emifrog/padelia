import type { TournamentStatus, TournamentFormat, BracketMatchStatus } from '@/types';

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Brouillon',
  registration_open: 'Inscriptions ouvertes',
  registration_closed: 'Inscriptions fermees',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

export const TOURNAMENT_STATUS_COLORS: Record<TournamentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  registration_open: 'bg-green-100 text-green-700',
  registration_closed: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'Elimination directe',
  round_robin: 'Poules',
};

export const TOURNAMENT_FORMAT_COLORS: Record<TournamentFormat, string> = {
  single_elimination: 'bg-purple-100 text-purple-700',
  round_robin: 'bg-indigo-100 text-indigo-700',
};

export const BRACKET_MATCH_STATUS_LABELS: Record<BracketMatchStatus, string> = {
  pending: 'A venir',
  scheduled: 'Programme',
  in_progress: 'En cours',
  completed: 'Termine',
  bye: 'Exempt',
};

export const MAX_TEAMS_OPTIONS = [4, 8, 16, 32] as const;

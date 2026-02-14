import type { MatchType, MatchStatus, MatchVisibility } from '@/types';

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  friendly: 'Amical',
  ranked: 'Classé',
  tournament: 'Tournoi',
};

export const MATCH_TYPE_COLORS: Record<MatchType, string> = {
  friendly: 'bg-blue-100 text-blue-700',
  ranked: 'bg-orange-100 text-orange-700',
  tournament: 'bg-purple-100 text-purple-700',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  open: 'Ouvert',
  full: 'Complet',
  confirmed: 'Confirmé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  open: 'bg-green-100 text-green-700',
  full: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const VISIBILITY_LABELS: Record<MatchVisibility, string> = {
  public: 'Public',
  group: 'Groupe',
  private: 'Privé',
};

export const DURATION_OPTIONS = [
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 150, label: '2h30' },
  { value: 180, label: '3h' },
] as const;

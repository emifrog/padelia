// ============================================================
// Padelia — Types centraux
// ============================================================

// Enums miroir du schema.sql
export type PlayerLevel = 'debutant' | 'initie' | 'intermediaire' | 'avance' | 'expert' | 'competition';
export type PlayingSide = 'gauche' | 'droite' | 'les_deux';
export type PlayStyle = 'offensif' | 'defensif' | 'mixte' | 'polyvalent';
export type PlayerGoal = 'loisir' | 'progression' | 'competition' | 'social';
export type MatchStatus = 'open' | 'full' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type MatchType = 'friendly' | 'ranked' | 'tournament';
export type MatchVisibility = 'public' | 'group' | 'private';
export type ParticipantStatus = 'invited' | 'confirmed' | 'declined' | 'cancelled' | 'no_show';
export type ParticipantRole = 'organizer' | 'player' | 'substitute';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type NotificationType = 'match_invite' | 'match_update' | 'match_reminder' | 'chat_message' | 'group_invite' | 'payment_request' | 'level_update' | 'system';

// Database row types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  level: PlayerLevel;
  level_score: number;
  preferred_side: PlayingSide;
  play_style: PlayStyle;
  player_goal: PlayerGoal;
  dominant_hand: 'droite' | 'gauche';
  years_playing: number;
  availability: Record<string, string[]>;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  max_distance_km: number;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  reliability_score: number;
  is_premium: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  organizer_id: string;
  title: string | null;
  description: string | null;
  match_type: MatchType;
  status: MatchStatus;
  visibility: MatchVisibility;
  scheduled_at: string;
  duration_minutes: number;
  club_id: string | null;
  court_id: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  max_players: number;
  min_level: PlayerLevel | null;
  max_level: PlayerLevel | null;
  cost_per_player: number;
  score_team_a: string | null;
  score_team_b: string | null;
  winner_team: 'A' | 'B' | null;
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchParticipant {
  id: string;
  match_id: string;
  player_id: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  team: 'A' | 'B' | null;
  position: PlayingSide | null;
  payment_status: PaymentStatus;
  payment_amount: number;
  rating_given: number | null;
  level_feedback: number | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// Labels français pour l'UI
export const LEVEL_LABELS: Record<PlayerLevel, string> = {
  debutant: 'Débutant',
  initie: 'Initié',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
  competition: 'Compétition',
};

export const LEVEL_SCORE_RANGES: Record<PlayerLevel, [number, number]> = {
  debutant: [1.0, 2.5],
  initie: [2.5, 4.0],
  intermediaire: [4.0, 5.5],
  avance: [5.5, 7.0],
  expert: [7.0, 8.5],
  competition: [8.5, 10.0],
};

export const SIDE_LABELS: Record<PlayingSide, string> = {
  gauche: 'Gauche (Revés)',
  droite: 'Droite (Drive)',
  les_deux: 'Les deux',
};

export const STYLE_LABELS: Record<PlayStyle, string> = {
  offensif: 'Offensif',
  defensif: 'Défensif',
  mixte: 'Mixte',
  polyvalent: 'Polyvalent',
};

export const GOAL_LABELS: Record<PlayerGoal, string> = {
  loisir: 'Loisir',
  progression: 'Progression',
  competition: 'Compétition',
  social: 'Social',
};

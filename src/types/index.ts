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
export type NotificationType = 'match_invite' | 'match_update' | 'match_reminder' | 'chat_message' | 'group_invite' | 'payment_request' | 'level_update' | 'system' | 'tournament_update' | 'tournament_reminder';

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

// ============================================================
// Clubs, Courts, Bookings, Reviews
// ============================================================

export type ClubStatus = 'pending' | 'active' | 'suspended';
export type CourtSurface = 'vitree' | 'mur' | 'panoramique' | 'exterieur';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Club {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: ClubStatus;
  opening_hours: Record<string, { open: string; close: string }>;
  amenities: string[];
  stripe_account_id: string | null;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface Court {
  id: string;
  club_id: string;
  name: string;
  surface: CourtSurface;
  is_indoor: boolean;
  is_active: boolean;
  hourly_rate: number | null;
  created_at: string;
}

export interface Booking {
  id: string;
  court_id: string;
  booked_by: string;
  match_id: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
}

export interface ClubReview {
  id: string;
  club_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ============================================================
// Tournaments
// ============================================================

export type TournamentStatus = 'draft' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'round_robin';
export type BracketMatchStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'bye';

export interface Tournament {
  id: string;
  organizer_id: string;
  club_id: string | null;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  max_teams: number;
  team_count: number;
  entry_fee: number;
  prize_description: string | null;
  min_level: PlayerLevel | null;
  max_level: PlayerLevel | null;
  registration_deadline: string | null;
  starts_at: string;
  ends_at: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  rules: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  name: string;
  player_ids: string[];
  captain_id: string;
  seed: number | null;
  payment_status: PaymentStatus;
  stripe_checkout_session_id: string | null;
  registered_at: string;
  withdrawn_at: string | null;
}

export interface TournamentBracket {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: string | null;
  score_b: string | null;
  winner_team_id: string | null;
  status: BracketMatchStatus;
  scheduled_at: string | null;
  court_id: string | null;
  next_bracket_id: string | null;
  created_at: string;
}

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'Brouillon',
  registration_open: 'Inscriptions ouvertes',
  registration_closed: 'Inscriptions fermees',
  in_progress: 'En cours',
  completed: 'Termine',
  cancelled: 'Annule',
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'Elimination directe',
  round_robin: 'Poules',
};

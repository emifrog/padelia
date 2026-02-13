// Types générés par Supabase CLI : npx supabase gen types typescript
// Pour l'instant, types manuels alignés sur le schéma SQL

export type DominantHand = 'left' | 'right'
export type PreferredSide = 'left' | 'right' | 'both'
export type PlayStyle = 'offensive' | 'defensive' | 'mixed'
export type PlayerGoal = 'casual' | 'improvement' | 'competition'
export type MatchStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
export type MatchType = 'friendly' | 'ranked' | 'tournament'
export type InvitationStatus = 'invited' | 'accepted' | 'declined'
export type StatPeriod = 'weekly' | 'monthly' | 'all_time'
export type RankingScope = 'city' | 'region' | 'national'
export type RankingTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  level: number
  computed_level: number
  dominant_hand: DominantHand
  preferred_side: PreferredSide
  play_style: PlayStyle
  goal: PlayerGoal
  bio: string | null
  reliability_score: number
  is_premium: boolean
  matches_played: number
  wins: number
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  player_id: string
  day_of_week: number | null
  start_time: string
  end_time: string
  is_recurring: boolean
  specific_date: string | null
  created_at: string
}

export interface Match {
  id: string
  created_by: string
  status: MatchStatus
  match_type: MatchType
  scheduled_at: string
  location_name: string | null
  latitude: number | null
  longitude: number | null
  is_public: boolean
  min_level: number
  max_level: number
  winner_team: 1 | 2 | null
  balance_score: number | null
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  team: 1 | 2
  side: PreferredSide | null
  status: InvitationStatus
  rating_change: number | null
  invited_at: string
  responded_at: string | null
}

export interface MatchSet {
  id: string
  match_id: string
  set_number: number
  team1_score: number
  team2_score: number
  is_tiebreak: boolean
}

export interface PlayerStats {
  id: string
  player_id: string
  period: StatPeriod
  period_start: string
  matches_played: number
  wins: number
  losses: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  avg_balance_score: number | null
  win_streak: number
  best_streak: number
  level_at_period: number | null
  created_at: string
  updated_at: string
}

export interface Ranking {
  id: string
  player_id: string
  scope: RankingScope
  scope_value: string
  rank_position: number
  points: number
  tier: RankingTier
  updated_at: string
}

export interface PartnerHistory {
  id: string
  player_id: string
  partner_id: string
  matches_together: number
  wins_together: number
  matches_against: number
  wins_against: number
  chemistry_score: number | null
  last_played_at: string | null
  updated_at: string
}

// Types utilitaires pour le matching
export interface MatchScore {
  playerId: string
  totalScore: number
  levelScore: number
  sideScore: number
  geoScore: number
  availabilityScore: number
  reliabilityScore: number
}

// Types pour les formulaires
export interface ProfileFormData {
  username: string
  full_name: string
  city: string
  level: number
  dominant_hand: DominantHand
  preferred_side: PreferredSide
  play_style: PlayStyle
  goal: PlayerGoal
  bio: string
}

export interface CreateMatchFormData {
  scheduled_at: string
  location_name: string
  match_type: MatchType
  is_public: boolean
  min_level: number
  max_level: number
  notes: string
}

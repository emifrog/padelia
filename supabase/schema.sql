-- =====================================================
-- padelia — Schéma Supabase/PostgreSQL
-- MVP V1
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- pour calculs géographiques

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE dominant_hand AS ENUM ('left', 'right');
CREATE TYPE preferred_side AS ENUM ('left', 'right', 'both');
CREATE TYPE play_style AS ENUM ('offensive', 'defensive', 'mixed');
CREATE TYPE player_goal AS ENUM ('casual', 'improvement', 'competition');
CREATE TYPE match_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE match_type AS ENUM ('friendly', 'ranked', 'tournament');
CREATE TYPE invitation_status AS ENUM ('invited', 'accepted', 'declined');
CREATE TYPE stat_period AS ENUM ('weekly', 'monthly', 'all_time');
CREATE TYPE ranking_scope AS ENUM ('city', 'region', 'national');
CREATE TYPE ranking_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- =====================================================
-- TABLE: profiles
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  level REAL DEFAULT 3.0 CHECK (level >= 1.0 AND level <= 10.0),
  computed_level REAL DEFAULT 3.0 CHECK (computed_level >= 1.0 AND computed_level <= 10.0),
  dominant_hand dominant_hand DEFAULT 'right',
  preferred_side preferred_side DEFAULT 'right',
  play_style play_style DEFAULT 'mixed',
  goal player_goal DEFAULT 'casual',
  bio TEXT CHECK (char_length(bio) <= 500),
  reliability_score REAL DEFAULT 100.0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  is_premium BOOLEAN DEFAULT FALSE,
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche géographique
CREATE INDEX idx_profiles_geo ON profiles (latitude, longitude);
CREATE INDEX idx_profiles_level ON profiles (computed_level);
CREATE INDEX idx_profiles_city ON profiles (city);

-- =====================================================
-- TABLE: availability
-- =====================================================

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=lundi
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT recurring_or_specific CHECK (
    (is_recurring = TRUE AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (is_recurring = FALSE AND specific_date IS NOT NULL)
  )
);

CREATE INDEX idx_availability_player ON availability (player_id);
CREATE INDEX idx_availability_day ON availability (day_of_week);

-- =====================================================
-- TABLE: matches
-- =====================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  status match_status DEFAULT 'pending',
  match_type match_type DEFAULT 'friendly',
  scheduled_at TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_public BOOLEAN DEFAULT TRUE,
  min_level REAL DEFAULT 1.0,
  max_level REAL DEFAULT 10.0,
  winner_team INT CHECK (winner_team IN (1, 2)),
  balance_score REAL, -- score d'équilibre calculé par l'algo
  notes TEXT CHECK (char_length(notes) <= 300),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_level_range CHECK (min_level <= max_level)
);

CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_scheduled ON matches (scheduled_at);
CREATE INDEX idx_matches_created_by ON matches (created_by);
CREATE INDEX idx_matches_public ON matches (is_public, status);

-- =====================================================
-- TABLE: match_players
-- =====================================================

CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  team INT NOT NULL CHECK (team IN (1, 2)),
  side preferred_side,
  status invitation_status DEFAULT 'invited',
  rating_change REAL, -- variation de niveau post-match
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE (match_id, player_id)
);

CREATE INDEX idx_match_players_match ON match_players (match_id);
CREATE INDEX idx_match_players_player ON match_players (player_id);
CREATE INDEX idx_match_players_status ON match_players (status);

-- =====================================================
-- TABLE: match_sets
-- =====================================================

CREATE TABLE match_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number INT NOT NULL CHECK (set_number >= 1 AND set_number <= 3),
  team1_score INT NOT NULL DEFAULT 0 CHECK (team1_score >= 0),
  team2_score INT NOT NULL DEFAULT 0 CHECK (team2_score >= 0),
  is_tiebreak BOOLEAN DEFAULT FALSE,

  UNIQUE (match_id, set_number)
);

CREATE INDEX idx_match_sets_match ON match_sets (match_id);

-- =====================================================
-- TABLE: player_stats
-- =====================================================

CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period stat_period NOT NULL,
  period_start DATE NOT NULL,
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  sets_won INT DEFAULT 0,
  sets_lost INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  avg_balance_score REAL,
  win_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  level_at_period REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (player_id, period, period_start)
);

CREATE INDEX idx_player_stats_player ON player_stats (player_id);
CREATE INDEX idx_player_stats_period ON player_stats (period, period_start);

-- =====================================================
-- TABLE: rankings
-- =====================================================

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope ranking_scope NOT NULL,
  scope_value TEXT NOT NULL, -- ex: 'Nice', 'PACA', 'France'
  rank_position INT NOT NULL,
  points REAL DEFAULT 1000.0, -- Points ELO de départ
  tier ranking_tier DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (player_id, scope, scope_value)
);

CREATE INDEX idx_rankings_scope ON rankings (scope, scope_value, rank_position);
CREATE INDEX idx_rankings_player ON rankings (player_id);

-- =====================================================
-- TABLE: partner_history
-- =====================================================

CREATE TABLE partner_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matches_together INT DEFAULT 0,
  wins_together INT DEFAULT 0,
  matches_against INT DEFAULT 0,
  wins_against INT DEFAULT 0,
  chemistry_score REAL, -- compatibilité calculée
  last_played_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (player_id, partner_id),
  CONSTRAINT no_self_partner CHECK (player_id != partner_id)
);

CREATE INDEX idx_partner_history_player ON partner_history (player_id);
CREATE INDEX idx_partner_history_pair ON partner_history (player_id, partner_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_history ENABLE ROW LEVEL SECURITY;

-- PROFILES: lecture publique, écriture propriétaire
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING ((select auth.uid()) = id);

-- AVAILABILITY: lecture publique (pour matching), écriture propriétaire
CREATE POLICY "availability_read" ON availability FOR SELECT USING (true);
CREATE POLICY "availability_insert" ON availability FOR INSERT WITH CHECK ((select auth.uid()) = player_id);
CREATE POLICY "availability_update" ON availability FOR UPDATE USING ((select auth.uid()) = player_id);
CREATE POLICY "availability_delete" ON availability FOR DELETE USING ((select auth.uid()) = player_id);

-- MATCHES: lecture publique, création authentifiée, modification participants
CREATE POLICY "matches_read" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK ((select auth.uid()) = created_by);
CREATE POLICY "matches_update" ON matches FOR UPDATE USING (
  (select auth.uid()) = created_by OR
  (select auth.uid()) IN (SELECT player_id FROM match_players WHERE match_id = id AND status = 'accepted')
);

-- MATCH_PLAYERS: lecture publique, écriture participants
CREATE POLICY "match_players_read" ON match_players FOR SELECT USING (true);
CREATE POLICY "match_players_insert" ON match_players FOR INSERT WITH CHECK (
  (select auth.uid()) = player_id OR
  (select auth.uid()) = (SELECT created_by FROM matches WHERE id = match_id)
);
CREATE POLICY "match_players_update" ON match_players FOR UPDATE USING (
  (select auth.uid()) = player_id OR
  (select auth.uid()) = (SELECT created_by FROM matches WHERE id = match_id)
);

-- MATCH_SETS: lecture publique, écriture participants du match
CREATE POLICY "match_sets_read" ON match_sets FOR SELECT USING (true);
CREATE POLICY "match_sets_insert" ON match_sets FOR INSERT WITH CHECK (
  (select auth.uid()) IN (SELECT player_id FROM match_players WHERE match_id = match_sets.match_id AND status = 'accepted')
);
CREATE POLICY "match_sets_update" ON match_sets FOR UPDATE USING (
  (select auth.uid()) IN (SELECT player_id FROM match_players WHERE match_id = match_sets.match_id AND status = 'accepted')
);

-- PLAYER_STATS: lecture publique, écriture système (via service role)
CREATE POLICY "player_stats_read" ON player_stats FOR SELECT USING (true);

-- RANKINGS: lecture publique, écriture système
CREATE POLICY "rankings_read" ON rankings FOR SELECT USING (true);

-- PARTNER_HISTORY: lecture publique, écriture système
CREATE POLICY "partner_history_read" ON partner_history FOR SELECT USING (true);

-- =====================================================
-- FONCTIONS TRIGGER
-- =====================================================

-- Mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER partner_history_updated_at BEFORE UPDATE ON partner_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Création automatique du profil après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FONCTION: Calcul distance Haversine (si pas PostGIS)
-- =====================================================

CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  r DOUBLE PRECISION := 6371; -- rayon Terre en km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2)^2;
  RETURN r * 2 * ASIN(SQRT(a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FONCTION: Joueurs proches par niveau et localisation
-- =====================================================

CREATE OR REPLACE FUNCTION find_nearby_players(
  p_player_id UUID,
  p_max_distance_km DOUBLE PRECISION DEFAULT 30,
  p_max_level_gap REAL DEFAULT 2.0,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  player_id UUID,
  username TEXT,
  computed_level REAL,
  preferred_side preferred_side,
  play_style play_style,
  distance_km DOUBLE PRECISION,
  level_gap REAL,
  reliability_score REAL
) AS $$
DECLARE
  v_player profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_player FROM profiles WHERE id = p_player_id;
  
  IF v_player.latitude IS NULL OR v_player.longitude IS NULL THEN
    RAISE EXCEPTION 'Player location not set';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS player_id,
    p.username,
    p.computed_level,
    p.preferred_side,
    p.play_style,
    haversine_distance(v_player.latitude, v_player.longitude, p.latitude, p.longitude) AS distance_km,
    ABS(v_player.computed_level - p.computed_level) AS level_gap,
    p.reliability_score
  FROM profiles p
  WHERE p.id != p_player_id
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND haversine_distance(v_player.latitude, v_player.longitude, p.latitude, p.longitude) <= p_max_distance_km
    AND ABS(v_player.computed_level - p.computed_level) <= p_max_level_gap
  ORDER BY 
    ABS(v_player.computed_level - p.computed_level) ASC,
    haversine_distance(v_player.latitude, v_player.longitude, p.latitude, p.longitude) ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Phase 7 — Tournois & Competition
-- Migration: add tournaments, tournament_teams, tournament_brackets
-- ============================================================

-- ── Enums ──

CREATE TYPE tournament_status AS ENUM (
  'draft', 'registration_open', 'registration_closed',
  'in_progress', 'completed', 'cancelled'
);

CREATE TYPE tournament_format AS ENUM (
  'single_elimination', 'round_robin'
);

CREATE TYPE bracket_match_status AS ENUM (
  'pending', 'scheduled', 'in_progress', 'completed', 'bye'
);

-- ── Tables ──

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  format tournament_format DEFAULT 'single_elimination',
  status tournament_status DEFAULT 'draft',
  max_teams INTEGER NOT NULL CHECK (max_teams >= 4 AND max_teams <= 64),
  team_count INTEGER DEFAULT 0,
  entry_fee NUMERIC(8,2) DEFAULT 0 CHECK (entry_fee >= 0),
  prize_description TEXT,
  min_level player_level,
  max_level player_level,
  registration_deadline TIMESTAMPTZ,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_ids UUID[] NOT NULL,
  captain_id UUID NOT NULL REFERENCES profiles(id),
  seed INTEGER,
  payment_status payment_status DEFAULT 'pending',
  stripe_checkout_session_id TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  UNIQUE(tournament_id, captain_id)
);

CREATE TABLE tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  position INTEGER NOT NULL,
  team_a_id UUID REFERENCES tournament_teams(id),
  team_b_id UUID REFERENCES tournament_teams(id),
  score_a TEXT,
  score_b TEXT,
  winner_team_id UUID REFERENCES tournament_teams(id),
  status bracket_match_status DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  court_id UUID REFERENCES courts(id),
  next_bracket_id UUID REFERENCES tournament_brackets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, round, position)
);

-- ── Indexes ──

CREATE INDEX idx_tournaments_status_date ON tournaments (status, starts_at);
CREATE INDEX idx_tournaments_organizer ON tournaments (organizer_id);
CREATE INDEX idx_tournaments_club ON tournaments (club_id);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams (tournament_id);
CREATE INDEX idx_tournament_teams_captain ON tournament_teams (captain_id);
CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets (tournament_id, round, position);

-- ── Triggers ──

-- updated_at auto-update (reuses existing update_updated_at function)
CREATE TRIGGER tr_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto team_count increment/decrement
CREATE OR REPLACE FUNCTION update_tournament_team_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments SET team_count = team_count + 1 WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments SET team_count = team_count - 1 WHERE id = OLD.tournament_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tournament_team_count
  AFTER INSERT OR DELETE ON tournament_teams
  FOR EACH ROW EXECUTE FUNCTION update_tournament_team_count();

-- ── RLS ──

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tournaments_select ON tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_insert ON tournaments FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY tournaments_update ON tournaments FOR UPDATE USING (auth.uid() = organizer_id);

ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY tt_select ON tournament_teams FOR SELECT USING (true);
CREATE POLICY tt_insert ON tournament_teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY tt_update ON tournament_teams FOR UPDATE USING (
  auth.uid() = captain_id
  OR EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_teams.tournament_id AND organizer_id = auth.uid())
);

ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tb_select ON tournament_brackets FOR SELECT USING (true);
CREATE POLICY tb_insert ON tournament_brackets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_brackets.tournament_id AND organizer_id = auth.uid())
);
CREATE POLICY tb_update ON tournament_brackets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM tournaments WHERE id = tournament_brackets.tournament_id AND organizer_id = auth.uid())
);

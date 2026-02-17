-- ============================================================
-- PADELMATCH - Schéma de base de données complet
-- Version 1.0 - Février 2026
-- Stack: Supabase (PostgreSQL 15+)
-- ============================================================

-- Extension nécessaire pour EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- 1. TYPES ÉNUMÉRÉS
-- ============================================================

CREATE TYPE player_level AS ENUM (
  'debutant', 'initie', 'intermediaire',
  'avance', 'expert', 'competition'
);

CREATE TYPE playing_side AS ENUM ('gauche', 'droite', 'les_deux');
CREATE TYPE play_style AS ENUM ('offensif', 'defensif', 'mixte', 'polyvalent');
CREATE TYPE player_goal AS ENUM ('loisir', 'progression', 'competition', 'social');

CREATE TYPE match_status AS ENUM (
  'open', 'full', 'confirmed', 'in_progress',
  'completed', 'cancelled'
);
CREATE TYPE match_type AS ENUM ('friendly', 'ranked', 'tournament');
CREATE TYPE match_visibility AS ENUM ('public', 'group', 'private');

CREATE TYPE participant_status AS ENUM (
  'invited', 'confirmed', 'declined', 'cancelled', 'no_show'
);
CREATE TYPE participant_role AS ENUM ('organizer', 'player', 'substitute');

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'refunded', 'failed'
);

CREATE TYPE group_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE group_visibility AS ENUM ('public', 'private', 'invite_only');

CREATE TYPE club_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE court_surface AS ENUM ('vitree', 'mur', 'panoramique', 'exterieur');
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'cancelled', 'completed'
);

CREATE TYPE notification_type AS ENUM (
  'match_invite', 'match_update', 'match_reminder',
  'chat_message', 'group_invite', 'payment_request',
  'level_update', 'system'
);

-- ============================================================
-- 2. TABLES
-- ============================================================

-- 2.1 PROFILES (joueurs)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,

  -- Padel profile
  level player_level DEFAULT 'initie',
  level_score NUMERIC(4,1) DEFAULT 3.0 CHECK (level_score >= 1.0 AND level_score <= 10.0),
  preferred_side playing_side DEFAULT 'les_deux',
  play_style play_style DEFAULT 'mixte',
  player_goal player_goal DEFAULT 'loisir',
  dominant_hand TEXT DEFAULT 'droite' CHECK (dominant_hand IN ('droite', 'gauche')),
  years_playing INTEGER DEFAULT 0 CHECK (years_playing >= 0),

  -- Disponibilités (JSON: {lundi: ['18:00-20:00'], mardi: [...], ...})
  availability JSONB DEFAULT '{}'::jsonb,

  -- Géolocalisation
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  max_distance_km INTEGER DEFAULT 30 CHECK (max_distance_km > 0 AND max_distance_km <= 200),

  -- Stats agrégées (matérialisées par trigger)
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  reliability_score NUMERIC(3,2) DEFAULT 1.00 CHECK (reliability_score >= 0 AND reliability_score <= 1),

  -- Abonnement
  is_premium BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  premium_expires_at TIMESTAMPTZ,

  -- Préférences notifications (JSONB)
  notification_preferences JSONB DEFAULT '{"push_enabled":true,"email_match_invite":true,"email_match_reminder":true,"push_new_message":true,"push_match_update":true,"push_group_activity":true}'::jsonb,

  -- Méta
  is_onboarded BOOLEAN DEFAULT false,
  push_token TEXT,
  locale TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 CLUBS
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,

  -- Adresse
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Config
  status club_status DEFAULT 'pending',
  opening_hours JSONB DEFAULT '{}'::jsonb,
  amenities TEXT[] DEFAULT '{}',
  stripe_account_id TEXT,

  -- Stats
  rating NUMERIC(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 COURTS (terrains)
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surface court_surface DEFAULT 'vitree',
  is_indoor BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  hourly_rate NUMERIC(8,2),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 GROUPS (communautés)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  visibility group_visibility DEFAULT 'public',

  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_members INTEGER DEFAULT 100,

  member_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 GROUP_MEMBERS
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role group_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY (group_id, user_id)
);

-- 2.6 MATCHES
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES profiles(id),

  -- Infos match
  title TEXT,
  description TEXT,
  match_type match_type DEFAULT 'friendly',
  status match_status DEFAULT 'open',
  visibility match_visibility DEFAULT 'public',

  -- Quand
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 90 CHECK (duration_minutes > 0),

  -- Où
  club_id UUID REFERENCES clubs(id),
  court_id UUID REFERENCES courts(id),
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Configuration
  max_players INTEGER DEFAULT 4 CHECK (max_players IN (2, 4)),
  min_level player_level,
  max_level player_level,
  cost_per_player NUMERIC(8,2) DEFAULT 0 CHECK (cost_per_player >= 0),

  -- Résultats
  score_team_a TEXT,
  score_team_b TEXT,
  winner_team TEXT CHECK (winner_team IN ('A', 'B', NULL)),

  -- Méta
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 MATCH_PARTICIPANTS
CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),

  role participant_role DEFAULT 'player',
  status participant_status DEFAULT 'invited',
  team TEXT CHECK (team IN ('A', 'B', NULL)),
  position playing_side,

  -- Paiement
  payment_status payment_status DEFAULT 'pending',
  payment_amount NUMERIC(8,2) DEFAULT 0,
  stripe_payment_id TEXT,

  -- Feedback post-match
  rating_given SMALLINT CHECK (rating_given >= 1 AND rating_given <= 5),
  level_feedback NUMERIC(4,1) CHECK (level_feedback >= 1.0 AND level_feedback <= 10.0),

  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(match_id, player_id)
);

-- 2.8 BOOKINGS (réservations)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id),
  booked_by UUID NOT NULL REFERENCES profiles(id),
  match_id UUID REFERENCES matches(id),

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status booking_status DEFAULT 'pending',
  total_amount NUMERIC(8,2) NOT NULL CHECK (total_amount >= 0),
  stripe_payment_intent_id TEXT,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Empêcher les doubles réservations
  CONSTRAINT no_overlap EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled')
);

-- 2.9 CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'match', 'group')),
  match_id UUID REFERENCES matches(id),
  group_id UUID REFERENCES groups(id),
  name TEXT,

  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 CONVERSATION_MEMBERS
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  is_muted BOOLEAN DEFAULT false,

  PRIMARY KEY (conversation_id, user_id)
);

-- 2.11 MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'system', 'match_invite')),
  metadata JSONB DEFAULT '{}'::jsonb,

  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.13 PLAYER_STATS (historique détaillé par match)
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id),
  match_id UUID NOT NULL REFERENCES matches(id),

  partner_id UUID REFERENCES profiles(id),
  was_winner BOOLEAN,
  sets_won INTEGER DEFAULT 0,
  sets_lost INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,

  -- Niveau estimé post-match
  level_before NUMERIC(4,1),
  level_after NUMERIC(4,1),
  level_change NUMERIC(4,1),

  -- Peer review
  peer_level_estimate NUMERIC(4,1),

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, match_id)
);

-- 2.14 CLUB_REVIEWS
CREATE TABLE club_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(club_id, user_id)
);

-- ============================================================
-- 3. INDEX DE PERFORMANCE
-- ============================================================

-- Géolocalisation
CREATE INDEX idx_profiles_geo ON profiles (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_clubs_geo ON clubs (latitude, longitude);
CREATE INDEX idx_matches_geo ON matches (latitude, longitude) WHERE latitude IS NOT NULL;

-- Recherche de matchs
CREATE INDEX idx_matches_status_date ON matches (status, scheduled_at);
CREATE INDEX idx_matches_organizer ON matches (organizer_id);
CREATE INDEX idx_match_participants_player ON match_participants (player_id);
CREATE INDEX idx_match_participants_match ON match_participants (match_id);

-- Chat
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_conversation_members_user ON conversation_members (user_id);

-- Groupes
CREATE INDEX idx_group_members_user ON group_members (user_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- Stats
CREATE INDEX idx_player_stats_player ON player_stats (player_id, created_at DESC);

-- Bookings
CREATE INDEX idx_bookings_court_time ON bookings (court_id, start_time, end_time);
CREATE INDEX idx_bookings_user ON bookings (booked_by);

-- Full-text search
CREATE INDEX idx_profiles_search ON profiles USING gin (
  to_tsvector('french', coalesce(full_name, '') || ' ' || coalesce(city, ''))
);
CREATE INDEX idx_clubs_search ON clubs USING gin (
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(city, ''))
);

-- ============================================================
-- 4. FONCTIONS
-- ============================================================

-- Distance Haversine (km)
CREATE OR REPLACE FUNCTION haversine_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
SELECT 6371 * acos(
  LEAST(1.0, GREATEST(-1.0,
    cos(radians(lat1)) * cos(radians(lat2)) *
    cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) * sin(radians(lat2))
  ))
);
$$ LANGUAGE sql IMMUTABLE;

-- Recherche joueurs à proximité avec matching
CREATE OR REPLACE FUNCTION find_nearby_players(
  p_user_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_max_distance_km INTEGER DEFAULT 30,
  p_level player_level DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  id UUID, full_name TEXT, username TEXT,
  avatar_url TEXT, level player_level,
  level_score NUMERIC, preferred_side playing_side,
  play_style play_style, city TEXT,
  distance_km DOUBLE PRECISION, match_score NUMERIC
) AS $$
  SELECT p.id, p.full_name, p.username,
    p.avatar_url, p.level, p.level_score,
    p.preferred_side, p.play_style, p.city,
    haversine_distance(p_latitude, p_longitude, p.latitude, p.longitude) AS distance_km,
    -- Score de matching composite (0-100)
    (
      -- Niveau similaire (40%)
      (1.0 - LEAST(ABS(p.level_score - (SELECT ps.level_score FROM profiles ps WHERE ps.id = p_user_id)), 5.0) / 5.0) * 40 +
      -- Position complémentaire (20%)
      CASE
        WHEN p.preferred_side != (SELECT ps.preferred_side FROM profiles ps WHERE ps.id = p_user_id)
          AND p.preferred_side != 'les_deux'
          AND (SELECT ps.preferred_side FROM profiles ps WHERE ps.id = p_user_id) != 'les_deux'
        THEN 20
        WHEN p.preferred_side = 'les_deux' OR (SELECT ps.preferred_side FROM profiles ps WHERE ps.id = p_user_id) = 'les_deux'
        THEN 12
        ELSE 5
      END +
      -- Fiabilité (20%)
      p.reliability_score * 20 +
      -- Proximité (20%)
      (1.0 - LEAST(haversine_distance(p_latitude, p_longitude, p.latitude, p.longitude), p_max_distance_km::DOUBLE PRECISION) / p_max_distance_km::DOUBLE PRECISION) * 20
    )::NUMERIC AS match_score
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.latitude IS NOT NULL
    AND p.is_onboarded = true
    AND haversine_distance(p_latitude, p_longitude, p.latitude, p.longitude) <= p_max_distance_km
    AND (p_level IS NULL OR p.level = p_level)
  ORDER BY match_score DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'player_' || substr(NEW.id::text, 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation last_message on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clubs
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY clubs_select ON clubs FOR SELECT USING (true);
CREATE POLICY clubs_insert ON clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY clubs_update ON clubs FOR UPDATE USING (auth.uid() = owner_id);

-- Courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY courts_select ON courts FOR SELECT USING (true);
CREATE POLICY courts_manage ON courts FOR ALL USING (
  EXISTS (SELECT 1 FROM clubs WHERE clubs.id = courts.club_id AND clubs.owner_id = auth.uid())
);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY matches_select ON matches FOR SELECT USING (
  visibility = 'public'
  OR organizer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM match_participants WHERE match_id = matches.id AND player_id = auth.uid())
  OR (visibility = 'group' AND EXISTS (
    SELECT 1 FROM group_members WHERE group_id = matches.group_id AND user_id = auth.uid()
  ))
);
CREATE POLICY matches_insert ON matches FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY matches_update ON matches FOR UPDATE USING (auth.uid() = organizer_id);

-- Match Participants
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY mp_select ON match_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM matches WHERE id = match_participants.match_id AND (
    visibility = 'public' OR organizer_id = auth.uid()
  ))
  OR player_id = auth.uid()
);
CREATE POLICY mp_insert ON match_participants FOR INSERT WITH CHECK (
  auth.uid() = player_id
  OR EXISTS (SELECT 1 FROM matches WHERE id = match_participants.match_id AND organizer_id = auth.uid())
);
CREATE POLICY mp_update ON match_participants FOR UPDATE USING (
  auth.uid() = player_id
  OR EXISTS (SELECT 1 FROM matches WHERE id = match_participants.match_id AND organizer_id = auth.uid())
);

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_select ON bookings FOR SELECT USING (
  booked_by = auth.uid()
  OR EXISTS (SELECT 1 FROM clubs WHERE id = (SELECT club_id FROM courts WHERE courts.id = bookings.court_id) AND owner_id = auth.uid())
);
CREATE POLICY bookings_insert ON bookings FOR INSERT WITH CHECK (auth.uid() = booked_by);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_select ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

-- Conversation Members
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_select ON conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);

-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_select ON groups FOR SELECT USING (
  visibility = 'public'
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid())
);
CREATE POLICY groups_insert ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY groups_update ON groups FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);

-- Group Members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY gm_select ON group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND (
    visibility = 'public' OR created_by = auth.uid()
  ))
  OR user_id = auth.uid()
);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Player Stats
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY stats_select ON player_stats FOR SELECT USING (true);
CREATE POLICY stats_insert ON player_stats FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Club Reviews
ALTER TABLE club_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_select ON club_reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON club_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_update ON club_reviews FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 7. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('groups', 'groups', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', false);

-- Storage policies
CREATE POLICY avatar_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY avatar_read ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY clubs_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clubs' AND EXISTS (
    SELECT 1 FROM clubs WHERE owner_id = auth.uid() AND id::text = (storage.foldername(name))[1]
  ));
CREATE POLICY clubs_read ON storage.objects FOR SELECT
  USING (bucket_id = 'clubs');

CREATE POLICY chat_images_upload ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);
CREATE POLICY chat_images_read ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

-- ============================================================
-- TOURNAMENTS (Phase 7)
-- ============================================================

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

-- Tournaments
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

-- Tournament teams (duo = 2 player_ids)
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

-- Tournament brackets (elimination tree)
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

-- Indexes
CREATE INDEX idx_tournaments_status_date ON tournaments (status, starts_at);
CREATE INDEX idx_tournaments_organizer ON tournaments (organizer_id);
CREATE INDEX idx_tournaments_club ON tournaments (club_id);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams (tournament_id);
CREATE INDEX idx_tournament_teams_captain ON tournament_teams (captain_id);
CREATE INDEX idx_tournament_brackets_tournament ON tournament_brackets (tournament_id, round, position);

-- Trigger updated_at
CREATE TRIGGER tr_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger auto team_count on INSERT
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

-- RLS
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

-- ============================================================
-- FIN DU SCHEMA
-- ============================================================

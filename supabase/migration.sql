-- Just Add Water — Database Schema
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  strava_athlete_id BIGINT,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTH.JS REQUIRED TABLES
-- ============================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================
-- INVITES
-- ============================================================
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT,
  invitee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ
);

-- ============================================================
-- ROUTES
-- ============================================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('river', 'lake', 'coastal', 'canal')),
  difficulty TEXT NOT NULL DEFAULT 'moderate' CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  geojson JSONB,
  distance_km NUMERIC(6,2),
  put_in_lat NUMERIC(9,6),
  put_in_lng NUMERIC(9,6),
  put_in_description TEXT,
  take_out_lat NUMERIC(9,6),
  take_out_lng NUMERIC(9,6),
  take_out_description TEXT,
  best_season_notes TEXT,
  hubeau_station_code TEXT,
  min_water_level_notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PADDLES
-- ============================================================
CREATE TABLE paddles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  start_time TIME,
  end_time TIME,
  distance_km NUMERIC(6,2),
  notes TEXT,
  weather_snapshot JSONB,
  water_level_snapshot JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PADDLE PARTICIPANTS
-- ============================================================
CREATE TABLE paddle_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_id UUID NOT NULL REFERENCES paddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('organiser', 'participant')),
  rsvp TEXT NOT NULL DEFAULT 'going' CHECK (rsvp IN ('going', 'not_going', 'maybe')),
  strava_activity_id TEXT,
  distance_km NUMERIC(6,2),
  duration_minutes INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(paddle_id, user_id)
);

-- ============================================================
-- PADDLE COMMENTS
-- ============================================================
CREATE TABLE paddle_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_id UUID NOT NULL REFERENCES paddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general' CHECK (comment_type IN ('general', 'hazard', 'access', 'tip')),
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PADDLE PHOTOS
-- ============================================================
CREATE TABLE paddle_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_id UUID NOT NULL REFERENCES paddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photo_type TEXT NOT NULL DEFAULT 'general' CHECK (photo_type IN ('general', 'put_in', 'take_out', 'hazard', 'scenic')),
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTE COMMENTS
-- ============================================================
CREATE TABLE route_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general' CHECK (comment_type IN ('general', 'hazard', 'access', 'conditions', 'tip')),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTE PHOTOS
-- ============================================================
CREATE TABLE route_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photo_type TEXT NOT NULL DEFAULT 'scenic' CHECK (photo_type IN ('put_in', 'take_out', 'hazard', 'scenic', 'access', 'parking')),
  location_lat NUMERIC(9,6),
  location_lng NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SHUTTLE OFFERS
-- ============================================================
CREATE TABLE shuttle_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_id UUID NOT NULL REFERENCES paddles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats_available INTEGER NOT NULL DEFAULT 1,
  direction TEXT NOT NULL CHECK (direction IN ('to_put_in', 'from_take_out', 'both')),
  pickup_location_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FLOAT PLANS
-- ============================================================
CREATE TABLE float_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_id UUID NOT NULL REFERENCES paddles(id) ON DELETE CASCADE,
  expected_return_time TIMESTAMPTZ NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- CHALLENGES
-- ============================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  target_km NUMERIC(7,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  route_filter JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed')),
  final_km NUMERIC(7,2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BADGES DEFINITIONS
-- ============================================================
CREATE TABLE badges_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('distance', 'count', 'streak', 'variety', 'challenge')),
  criteria JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- BADGES EARNED
-- ============================================================
CREATE TABLE badges_earned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paddle_id UUID REFERENCES paddles(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_id)
);

-- ============================================================
-- USER STREAKS
-- ============================================================
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak_weeks INTEGER NOT NULL DEFAULT 0,
  longest_streak_weeks INTEGER NOT NULL DEFAULT 0,
  streak_start_date DATE,
  last_paddle_week TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_paddles_date ON paddles(date);
CREATE INDEX idx_paddles_status ON paddles(status);
CREATE INDEX idx_paddles_route ON paddles(route_id);
CREATE INDEX idx_paddle_participants_paddle ON paddle_participants(paddle_id);
CREATE INDEX idx_paddle_participants_user ON paddle_participants(user_id);
CREATE INDEX idx_paddle_comments_paddle ON paddle_comments(paddle_id);
CREATE INDEX idx_paddle_photos_paddle ON paddle_photos(paddle_id);
CREATE INDEX idx_route_comments_route ON route_comments(route_id);
CREATE INDEX idx_route_photos_route ON route_photos(route_id);
CREATE INDEX idx_badges_earned_user ON badges_earned(user_id);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER route_comments_updated_at
  BEFORE UPDATE ON route_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: BADGE DEFINITIONS
-- ============================================================
INSERT INTO badges_definitions (slug, name, description, icon, category, criteria, sort_order) VALUES
-- Distance badges
('first_splash',       'First Splash',        'Log your first paddle',              '💦', 'distance', '{"type": "total_km", "threshold": 0}',    1),
('finding_your_stroke','Finding Your Stroke',  'Paddle 25km total',                  '🟢', 'distance', '{"type": "total_km", "threshold": 25}',   2),
('river_regular',      'River Regular',        'Paddle 100km total',                 '🔵', 'distance', '{"type": "total_km", "threshold": 100}',  3),
('channel_crosser',    'Channel Crosser',      'Paddle 250km total',                 '🟣', 'distance', '{"type": "total_km", "threshold": 250}',  4),
('vendee_viking',      'Vendée Viking',        'Paddle 500km total',                 '⚔️', 'distance', '{"type": "total_km", "threshold": 500}',  5),
('atlantic_adventurer','Atlantic Adventurer',   'Paddle 1,000km total',              '🌊', 'distance', '{"type": "total_km", "threshold": 1000}', 6),
('legendary_paddler',  'Legendary Paddler',     'Paddle 2,500km total',              '👑', 'distance', '{"type": "total_km", "threshold": 2500}', 7),
-- Count badges
('getting_started',    'Getting Started',       'Complete 5 paddles',                '🛶', 'count',    '{"type": "total_paddles", "threshold": 5}',   10),
('double_digits',      'Double Digits',         'Complete 10 paddles',               '🔟', 'count',    '{"type": "total_paddles", "threshold": 10}',  11),
('quarter_century',    'Quarter Century',        'Complete 25 paddles',               '🏅', 'count',    '{"type": "total_paddles", "threshold": 25}',  12),
('half_ton',           'Half Ton',              'Complete 50 paddles',               '💪', 'count',    '{"type": "total_paddles", "threshold": 50}',  13),
('century',            'Century',               'Complete 100 paddles',              '💯', 'count',    '{"type": "total_paddles", "threshold": 100}', 14),
-- Streak badges
('two_timer',          'Two-Timer',             '2-week paddle streak',              '🔥', 'streak',   '{"type": "streak_weeks", "threshold": 2}',  20),
('hat_trick',          'Hat Trick',             '3-week paddle streak',              '🎩', 'streak',   '{"type": "streak_weeks", "threshold": 3}',  21),
('month_of_momentum',  'Month of Momentum',     '4-week paddle streak',              '📈', 'streak',   '{"type": "streak_weeks", "threshold": 4}',  22),
('unstoppable',        'Unstoppable',           '8-week paddle streak',              '⚡', 'streak',   '{"type": "streak_weeks", "threshold": 8}',  23),
('all_season_paddler', 'All-Season Paddler',     '12-week paddle streak',             '🌦️', 'streak',   '{"type": "streak_weeks", "threshold": 12}', 24);

-- ============================================================
-- ROW LEVEL SECURITY (Basic — allow authenticated access)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shuttle_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE float_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_earned ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so our API routes (using service role key) have full access.
-- For client-side access, we'd add policies here. Since we use server-side API routes
-- with the service role key, these tables are protected by default.

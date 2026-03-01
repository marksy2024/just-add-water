-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "avatar_url" TEXT,
    "strava_athlete_id" BIGINT,
    "strava_access_token" TEXT,
    "strava_refresh_token" TEXT,
    "strava_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" BIGINT,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_email" TEXT,
    "invitee_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'moderate',
    "geojson" JSONB,
    "distance_km" DECIMAL(6,2),
    "put_in_lat" DECIMAL(9,6),
    "put_in_lng" DECIMAL(9,6),
    "put_in_description" TEXT,
    "take_out_lat" DECIMAL(9,6),
    "take_out_lng" DECIMAL(9,6),
    "take_out_description" TEXT,
    "best_season_notes" TEXT,
    "hubeau_station_code" TEXT,
    "min_water_level_notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddles" (
    "id" TEXT NOT NULL,
    "route_id" TEXT,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "start_time" TEXT,
    "end_time" TEXT,
    "distance_km" DECIMAL(6,2),
    "notes" TEXT,
    "weather_snapshot" JSONB,
    "water_level_snapshot" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_participants" (
    "id" TEXT NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "rsvp" TEXT NOT NULL DEFAULT 'going',
    "strava_activity_id" TEXT,
    "distance_km" DECIMAL(6,2),
    "duration_minutes" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_comments" (
    "id" TEXT NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "comment_type" TEXT NOT NULL DEFAULT 'general',
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_photos" (
    "id" TEXT NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "photo_type" TEXT NOT NULL DEFAULT 'general',
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_comments" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "comment_type" TEXT NOT NULL DEFAULT 'general',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_photos" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "storage_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "photo_type" TEXT NOT NULL DEFAULT 'scenic',
    "location_lat" DECIMAL(9,6),
    "location_lng" DECIMAL(9,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shuttle_offers" (
    "id" TEXT NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seats_available" INTEGER NOT NULL DEFAULT 1,
    "direction" TEXT NOT NULL,
    "pickup_location_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shuttle_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "float_plans" (
    "id" TEXT NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "expected_return_time" TIMESTAMP(3) NOT NULL,
    "emergency_contact_name" TEXT NOT NULL,
    "emergency_contact_phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "float_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_km" DECIMAL(7,2) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "route_filter" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "final_km" DECIMAL(7,2),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges_definitions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "badges_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges_earned" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paddle_id" TEXT,

    CONSTRAINT "badges_earned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "user_id" TEXT NOT NULL,
    "current_streak_weeks" INTEGER NOT NULL DEFAULT 0,
    "longest_streak_weeks" INTEGER NOT NULL DEFAULT 0,
    "streak_start_date" DATE,
    "last_paddle_week" TEXT,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "paddle_participants_paddle_id_user_id_key" ON "paddle_participants"("paddle_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_definitions_slug_key" ON "badges_definitions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "badges_earned_user_id_badge_id_key" ON "badges_earned"("user_id", "badge_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddles" ADD CONSTRAINT "paddles_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddles" ADD CONSTRAINT "paddles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_participants" ADD CONSTRAINT "paddle_participants_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_participants" ADD CONSTRAINT "paddle_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_comments" ADD CONSTRAINT "paddle_comments_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_comments" ADD CONSTRAINT "paddle_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_photos" ADD CONSTRAINT "paddle_photos_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_photos" ADD CONSTRAINT "paddle_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_comments" ADD CONSTRAINT "route_comments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_comments" ADD CONSTRAINT "route_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_photos" ADD CONSTRAINT "route_photos_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_photos" ADD CONSTRAINT "route_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_offers" ADD CONSTRAINT "shuttle_offers_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_offers" ADD CONSTRAINT "shuttle_offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "float_plans" ADD CONSTRAINT "float_plans_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges_earned" ADD CONSTRAINT "badges_earned_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges_earned" ADD CONSTRAINT "badges_earned_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges_earned" ADD CONSTRAINT "badges_earned_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


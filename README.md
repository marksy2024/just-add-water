# Just Add Water

A paddling group companion app for logging paddles, sharing routes, tracking conditions, and staying safe on the water. Built for a small kayaking/canoeing group in the Vendee, France.

**Live at** [jaw.wearesmc.co.uk](https://jaw.wearesmc.co.uk)

## Features

### Core (MVP)
- **Authentication** — Passwordless email sign-in via Resend
- **Paddle Logging** — Log completed paddles with distance, duration, and notes
- **Paddle Planning** — Plan group paddles with RSVP, shuttle coordination, and comments
- **Routes** — Community route library with put-in/take-out coordinates, descriptions, and photos
- **Conditions** — Live weather (Open-Meteo), water levels (Hub'Eau), sunrise/sunset for each route
- **Calendar** — ICS feed of planned paddles
- **Challenges** — Monthly distance targets with progress tracking
- **Badges & Streaks** — Gamified progression with weekly paddle streaks
- **Group Stats** — Activity feed and leaderboard
- **Invites** — Token-based invite system to grow the group

### Phase 2
- **Route Maps** — Interactive Leaflet maps with route polylines, put-in/take-out markers, and photo pins
- **Variety Badges** — Explorer (5 routes), Cartographer (10 routes), All-Rounder (all 4 water types), Social Paddler (10 group paddles)
- **Float Plans** — Safety feature with emergency contact, expected return time, and overdue alerts on the dashboard
- **Conditions Traffic Light** — Green/amber/red assessment based on wind, rain, temperature, and water level trends, plus "Best Paddle Today" recommendation
- **GPX Import/Export** — Upload GPX files to create routes, download route GPX for GPS devices
- **Photo EXIF GPS** — Automatic GPS extraction from uploaded photos, displayed as pins on route maps
- **Strava Integration** — OAuth connect, automatic import of kayak/canoe activities via webhooks
- **Badge Sharing** — Share earned badges to WhatsApp

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (email provider) |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet + react-leaflet |
| Images | Sharp (resize, thumbnails, EXIF) |
| Icons | Lucide React |
| Email | Resend |
| Hosting | VPS with PM2 + Nginx |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your database URL, Resend API key, etc.

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed badge definitions
npm run seed

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/justaddwater
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Just Add Water <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Strava integration
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_VERIFY_TOKEN=
```

## Project Structure

```
src/
  app/
    (app)/              # Authenticated routes
      page.tsx          # Dashboard
      paddles/          # Paddle logging & planning
      routes/           # Route library
      conditions/       # Weather & water levels
      profile/          # User profile, badges, streaks
      calendar/         # ICS calendar
      challenges/       # Monthly challenges
    api/                # API routes
      paddles/          # CRUD + complete, RSVP, shuttle, float plan
      routes/           # CRUD + GPX export/import
      photos/           # Image upload with EXIF extraction
      strava/           # OAuth callback, webhook, disconnect
  components/
    ui/                 # Shared UI (Card, Button, Input, Badge)
    maps/               # RouteMap (Leaflet)
    paddles/            # RSVPButtons, FloatPlanForm, FloatPlanCard
    routes/             # ConditionsCard, TrafficLight
    profile/            # SignOutButton, StravaConnect
  lib/
    auth.ts             # NextAuth configuration
    db.ts               # Prisma client
    badges.ts           # Badge evaluation engine
    streaks.ts          # Streak calculation
    weather.ts          # Open-Meteo API
    water-level.ts      # Hub'Eau API
    conditions.ts       # Traffic light assessment
    gpx.ts              # GPX parse/generate + Haversine distance
    exif.ts             # EXIF GPS extraction
    strava.ts           # Strava OAuth + API client
prisma/
  schema.prisma         # 18 models
  seed.ts               # Badge definitions (17 badges)
```

## Deployment

```bash
# Build for production
npm run build

# Start with PM2
pm2 start npm --name justaddwater -- start
```

## License

Private project. All rights reserved.

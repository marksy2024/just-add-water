import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDistance, formatDuration } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { SignOutButton } from '@/components/profile/SignOutButton'
import { StravaConnect } from '@/components/profile/StravaConnect'
import { getStravaAuthUrl } from '@/lib/strava'
import Link from 'next/link'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { Award, Flame, MapPin, UserPlus } from 'lucide-react'

// Avatar colours — deterministic per user
const avatarColors = [
  'bg-deep-ocean',
  'bg-atlantic-blue',
  'bg-kelp-green',
  'bg-sunset-coral',
  'bg-amber-buoy',
  'bg-paddle-coastal',
  'bg-paddle-canal',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default async function ProfilePage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [
    user,
    participations,
    streak,
    earnedBadges,
    allBadges,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.paddleParticipant.findMany({
      where: {
        userId,
        paddle: { status: 'completed' },
      },
      select: {
        distanceKm: true,
        durationMinutes: true,
        paddle: {
          select: {
            id: true,
            date: true,
            status: true,
            distanceKm: true,
            routeId: true,
            route: { select: { id: true, name: true, type: true } },
          },
        },
      },
    }),
    prisma.userStreak.findFirst({
      where: { userId },
    }),
    prisma.badgeEarned.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.badgeDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ])

  // Calculate stats
  const completedParticipations = participations?.filter(
    (p) => p.paddle && p.paddle.status === 'completed'
  ) || []

  const totalKm = completedParticipations.reduce(
    (sum, p) => sum + (Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0),
    0
  )
  const totalPaddles = completedParticipations.length
  const totalMinutes = completedParticipations.reduce(
    (sum, p) => sum + (p.durationMinutes || 0),
    0
  )
  const longestPaddle = completedParticipations.reduce((max, p) => {
    const km = Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0
    return km > max ? km : max
  }, 0)

  // Favourite route: most paddled
  const routeCounts: Record<string, { name: string; type: string; count: number }> = {}
  for (const p of completedParticipations) {
    const paddle = p.paddle
    if (!paddle?.routeId) continue
    const route = paddle.route
    if (!route) continue
    if (!routeCounts[route.id]) {
      routeCounts[route.id] = { name: route.name, type: route.type, count: 0 }
    }
    routeCounts[route.id].count++
  }
  const favouriteRoute = Object.values(routeCounts).sort((a, b) => b.count - a.count)[0] || null

  // Badge tracking
  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badgeId) || [])
  const earnedBadgeMap = new Map(
    earnedBadges?.map((b) => [b.badgeId, b]) || []
  )

  const userName = user?.name || session?.user?.name || 'Paddler'
  const userEmail = user?.email || session?.user?.email || ''
  const initial = userName.charAt(0).toUpperCase()
  const colorClass = getAvatarColor(userName)
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : 'Recently'

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full ${colorClass} flex items-center justify-center shrink-0`}
        >
          <span className="text-white font-bold text-2xl">{initial}</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-deep-ocean">{userName}</h1>
          <p className="text-sm text-driftwood">{userEmail}</p>
          <p className="text-xs text-driftwood mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Strava Connection */}
      <Card padding="sm">
        <StravaConnect
          isConnected={!!user?.stravaAthleteId}
          authUrl={getStravaAuthUrl()}
        />
      </Card>

      {/* Personal Stats */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          My Stats
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Total Distance</p>
            <p className="stat-number text-xl">{totalKm.toFixed(1)}km</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Total Paddles</p>
            <p className="stat-number text-xl">{totalPaddles}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Time on Water</p>
            <p className="stat-number text-xl">
              {totalMinutes > 0 ? formatDuration(totalMinutes) : '0h'}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Longest Paddle</p>
            <p className="stat-number text-xl">{formatDistance(longestPaddle)}</p>
          </Card>
        </div>

        {/* Favourite route */}
        {favouriteRoute && (
          <Card padding="sm" className="mt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-atlantic-blue" />
              <div>
                <p className="text-xs text-driftwood">Favourite Route</p>
                <p className="text-sm font-semibold text-deep-ocean">
                  {favouriteRoute.name}
                  <span className="text-xs font-normal text-driftwood ml-1">
                    ({favouriteRoute.count} paddle{favouriteRoute.count !== 1 ? 's' : ''})
                  </span>
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <WaveDividerSubtle />

      {/* Streaks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-sunset-coral" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Paddle Streak
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Current Streak</p>
            <p className="stat-number text-xl">
              {streak?.currentStreakWeeks || 0} week{(streak?.currentStreakWeeks || 0) !== 1 ? 's' : ''}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Longest Streak</p>
            <p className="stat-number text-xl">
              {streak?.longestStreakWeeks || 0} week{(streak?.longestStreakWeeks || 0) !== 1 ? 's' : ''}
            </p>
          </Card>
        </div>
      </div>

      <WaveDividerSubtle />

      {/* Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Badges ({earnedBadges?.length || 0} / {allBadges?.length || 0})
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {allBadges?.map((badge) => {
            const earned = earnedBadgeIds.has(badge.id)
            const earnedData = earnedBadgeMap.get(badge.id)
            return (
              <Card
                key={badge.id}
                padding="sm"
                className={`text-center ${earned ? '' : 'opacity-40 grayscale'}`}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <p className="text-xs font-semibold text-deep-ocean leading-tight">
                  {badge.name}
                </p>
                {earned && earnedData && (
                  <>
                    <p className="text-[10px] text-driftwood mt-0.5">
                      {formatDate(earnedData.earnedAt)}
                    </p>
                    <div className="mt-1.5">
                      <WhatsAppShare
                        message={`Just earned ${badge.name} on Just Add Water! ${badge.description} \u{1F6F6}`}
                        buttonText="Share"
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </>
                )}
                {!earned && (
                  <p className="text-[10px] text-driftwood mt-0.5 line-clamp-2">
                    {badge.description}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <WaveDividerSubtle />

      {/* Actions */}
      <div className="space-y-3">
        <Link href="/invite">
          <Card hover padding="sm">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-atlantic-blue" />
              <div>
                <p className="text-sm font-semibold text-deep-ocean">Invite a Paddler</p>
                <p className="text-xs text-driftwood">Grow the group</p>
              </div>
            </div>
          </Card>
        </Link>

        <SignOutButton />
      </div>
    </div>
  )
}

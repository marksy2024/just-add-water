import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDistance, formatDuration } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { SignOutButton } from '@/components/profile/SignOutButton'
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload'
import { ChangePassword } from '@/components/profile/ChangePassword'
import Link from 'next/link'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { Award, ChevronRight, Flame, MapPin, Waves, UserPlus } from 'lucide-react'

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
            title: true,
            date: true,
            status: true,
            distanceKm: true,
            routeId: true,
            route: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: { paddle: { date: 'desc' } },
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

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  function calcStats(items: typeof completedParticipations) {
    return {
      km: items.reduce((s, p) => s + (Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0), 0),
      paddles: items.length,
      minutes: items.reduce((s, p) => s + (p.durationMinutes || 0), 0),
    }
  }

  const monthItems = completedParticipations.filter((p) => new Date(p.paddle.date) >= monthStart)
  const yearItems = completedParticipations.filter((p) => new Date(p.paddle.date) >= yearStart)

  const monthStats = calcStats(monthItems)
  const yearStats = calcStats(yearItems)
  const allTimeStats = calcStats(completedParticipations)

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
        <ProfilePhotoUpload currentImage={user?.image || null} userName={userName} />
        <div>
          <h1 className="text-2xl font-extrabold text-deep-ocean">{userName}</h1>
          <p className="text-sm text-driftwood">{userEmail}</p>
          <p className="text-xs text-driftwood mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Personal Stats */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          My Stats
        </h2>

        {/* Month to Date */}
        <Card padding="sm" className="mb-3">
          <p className="text-xs font-semibold text-atlantic-blue uppercase tracking-wide mb-2">
            {now.toLocaleDateString('en-GB', { month: 'long' })} (Month to Date)
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="stat-number text-lg">{monthStats.km.toFixed(1)}km</p>
              <p className="text-[10px] text-driftwood">Distance</p>
            </div>
            <div>
              <p className="stat-number text-lg">{monthStats.paddles}</p>
              <p className="text-[10px] text-driftwood">Paddles</p>
            </div>
            <div>
              <p className="stat-number text-lg">{monthStats.minutes > 0 ? formatDuration(monthStats.minutes) : '0h'}</p>
              <p className="text-[10px] text-driftwood">Time</p>
            </div>
          </div>
        </Card>

        {/* Year to Date */}
        <Card padding="sm" className="mb-3">
          <p className="text-xs font-semibold text-kelp-green uppercase tracking-wide mb-2">
            {now.getFullYear()} (Year to Date)
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="stat-number text-lg">{yearStats.km.toFixed(1)}km</p>
              <p className="text-[10px] text-driftwood">Distance</p>
            </div>
            <div>
              <p className="stat-number text-lg">{yearStats.paddles}</p>
              <p className="text-[10px] text-driftwood">Paddles</p>
            </div>
            <div>
              <p className="stat-number text-lg">{yearStats.minutes > 0 ? formatDuration(yearStats.minutes) : '0h'}</p>
              <p className="text-[10px] text-driftwood">Time</p>
            </div>
          </div>
        </Card>

        {/* All Time */}
        <Card padding="sm" className="mb-3">
          <p className="text-xs font-semibold text-driftwood uppercase tracking-wide mb-2">
            All Time
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="stat-number text-lg">{allTimeStats.km.toFixed(1)}km</p>
              <p className="text-[10px] text-driftwood">Distance</p>
            </div>
            <div>
              <p className="stat-number text-lg">{allTimeStats.paddles}</p>
              <p className="text-[10px] text-driftwood">Paddles</p>
            </div>
            <div>
              <p className="stat-number text-lg">{allTimeStats.minutes > 0 ? formatDuration(allTimeStats.minutes) : '0h'}</p>
              <p className="text-[10px] text-driftwood">Time</p>
            </div>
            <div>
              <p className="stat-number text-lg">{formatDistance(longestPaddle)}</p>
              <p className="text-[10px] text-driftwood">Longest</p>
            </div>
          </div>
        </Card>

        {/* Favourite route */}
        {favouriteRoute && (
          <Card padding="sm">
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

      {/* My Paddles */}
      {completedParticipations.length > 0 && (
        <>
          <WaveDividerSubtle />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Waves className="w-4 h-4 text-atlantic-blue" />
              <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
                My Paddles
              </h2>
            </div>
            <div className="space-y-2">
              {completedParticipations.slice(0, 10).map((p) => {
                const km = Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0
                return (
                  <Link key={p.paddle.id} href={`/paddles/${p.paddle.id}`}>
                    <Card hover padding="sm">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-deep-ocean truncate">
                            {p.paddle.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-driftwood">
                            <span>{formatDate(p.paddle.date)}</span>
                            {p.paddle.route && (
                              <>
                                <span>&middot;</span>
                                <span className="truncate">{p.paddle.route.name}</span>
                              </>
                            )}
                            {km > 0 && (
                              <>
                                <span>&middot;</span>
                                <span>{formatDistance(km)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-driftwood shrink-0" />
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
            {completedParticipations.length > 10 && (
              <Link
                href="/paddles"
                className="block text-center text-sm font-semibold text-atlantic-blue hover:text-deep-ocean mt-3 transition-colors"
              >
                View all paddles
              </Link>
            )}
          </div>
        </>
      )}

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

      {/* Change Password */}
      <ChangePassword />

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

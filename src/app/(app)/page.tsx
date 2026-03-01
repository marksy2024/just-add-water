import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDashboardGreeting, formatDate, formatDistance, formatRelativeDate } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { TypeBadge, StatusBadge } from '@/components/ui/Badge'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { Plus, MapPin, Calendar, TrendingUp, Award, Flame, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const userName = session!.user!.name || 'Paddler'

  // Fetch all dashboard data in parallel
  const [
    user,
    nextPaddle,
    recentPaddles,
    myParticipations,
    groupActivity,
    streak,
    activeChallenges,
    overdueFloatPlans,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    // Next planned paddle the user is going to
    prisma.paddleParticipant.findFirst({
      where: {
        userId,
        rsvp: 'going',
        paddle: { status: 'planned' },
      },
      select: {
        paddleId: true,
        paddle: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            route: { select: { name: true, type: true } },
          },
        },
      },
      orderBy: { paddle: { date: 'asc' } },
    }),
    // Recent completed paddles by this user
    prisma.paddleParticipant.findMany({
      where: {
        userId,
        paddle: { status: 'completed' },
      },
      select: {
        paddleId: true,
        distanceKm: true,
        durationMinutes: true,
        paddle: {
          select: {
            id: true,
            title: true,
            date: true,
            distanceKm: true,
            route: { select: { name: true, type: true } },
          },
        },
      },
      orderBy: { paddle: { date: 'desc' } },
      take: 5,
    }),
    // All my participations for stats
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
            route: { select: { type: true } },
          },
        },
      },
    }),
    // Group activity feed
    prisma.paddle.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        title: true,
        date: true,
        distanceKm: true,
        status: true,
        createdBy: true,
        route: { select: { name: true, type: true } },
        participants: {
          select: {
            userId: true,
            user: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    // User streak
    prisma.userStreak.findFirst({
      where: { userId },
    }),
    // Active challenges
    prisma.challenge.findMany({
      where: { status: 'active' },
      take: 3,
    }),
    // Overdue float plans (active but past expected return)
    prisma.floatPlan.findMany({
      where: {
        status: 'active',
        expectedReturnTime: { lt: new Date() },
      },
      include: {
        paddle: {
          select: {
            id: true,
            title: true,
            participants: {
              where: { rsvp: 'going' },
              select: { user: { select: { name: true } } },
              take: 3,
            },
          },
        },
      },
      orderBy: { expectedReturnTime: 'asc' },
    }),
  ])

  // Calculate stats
  const totalDistance = myParticipations?.reduce((sum, p) => sum + (Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0), 0) || 0
  const totalPaddles = myParticipations?.length || 0
  const totalMinutes = myParticipations?.reduce((sum, p) => sum + (p.durationMinutes || 0), 0) || 0
  const longestPaddle = myParticipations?.reduce((max, p) => {
    const km = Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0
    return km > max ? km : max
  }, 0) || 0

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthDistance = myParticipations?.reduce((sum, p) => {
    const d = new Date(p.paddle?.date as unknown as string)
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + (Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0)
    }
    return sum
  }, 0) || 0

  const yearDistance = myParticipations?.reduce((sum, p) => {
    const d = new Date(p.paddle?.date as unknown as string)
    if (d.getFullYear() === currentYear) {
      return sum + (Number(p.distanceKm) || Number(p.paddle?.distanceKm) || 0)
    }
    return sum
  }, 0) || 0

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold text-deep-ocean">
          {getDashboardGreeting(userName.split(' ')[0])}
        </h1>
      </div>

      {/* Overdue Float Plan Warning */}
      {overdueFloatPlans && overdueFloatPlans.length > 0 && (
        <div className="space-y-2">
          {overdueFloatPlans.map((fp) => {
            const paddlers = fp.paddle.participants.map(p => p.user?.name || 'Unknown').join(', ')
            return (
              <Link key={fp.id} href={`/paddles/${fp.paddle.id}`}>
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-flag/10 border border-red-flag/20">
                  <AlertTriangle className="w-5 h-5 text-red-flag shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-flag">
                      Float plan overdue: {fp.paddle.title}
                    </p>
                    <p className="text-xs text-driftwood mt-0.5">
                      Expected back {new Date(fp.expectedReturnTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {paddlers && ` — ${paddlers}`}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Streak banner */}
      {streak && streak.currentStreakWeeks >= 2 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sunset-coral/10 border border-sunset-coral/20">
          <Flame className="w-5 h-5 text-sunset-coral" />
          <span className="text-sm font-semibold text-sunset-coral">
            {streak.currentStreakWeeks}-week paddle streak!
          </span>
        </div>
      )}
      {streak && streak.currentStreakWeeks === 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-shallows/10 border border-shallows/20">
          <span className="text-sm text-atlantic-blue">
            You paddled last week — keep it going this weekend?
          </span>
        </div>
      )}

      {/* Next planned paddle */}
      {(() => {
        if (!nextPaddle?.paddle) return null
        const np = nextPaddle.paddle
        return (
          <Link href={`/paddles/${np.id}`}>
            <Card hover className="border-l-4 border-l-atlantic-blue">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-atlantic-blue uppercase tracking-wide mb-1">Next Paddle</p>
                  <h3 className="font-bold text-deep-ocean">{np.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-driftwood">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(np.date)}
                    </span>
                    {np.route && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {np.route.name}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status="planned" />
              </div>
            </Card>
          </Link>
        )
      })()}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/paddles/new">
          <Card hover padding="sm" className="text-center">
            <Plus className="w-6 h-6 mx-auto mb-1 text-atlantic-blue" />
            <span className="text-xs font-semibold text-deep-ocean">Log Paddle</span>
          </Card>
        </Link>
        <Link href="/paddles/plan">
          <Card hover padding="sm" className="text-center">
            <Calendar className="w-6 h-6 mx-auto mb-1 text-atlantic-blue" />
            <span className="text-xs font-semibold text-deep-ocean">Plan Paddle</span>
          </Card>
        </Link>
        <Link href="/conditions">
          <Card hover padding="sm" className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-atlantic-blue" />
            <span className="text-xs font-semibold text-deep-ocean">Conditions</span>
          </Card>
        </Link>
      </div>

      {/* Active Challenge */}
      {activeChallenges && activeChallenges.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-sunset-coral" />
            <CardTitle>{activeChallenges[0].title}</CardTitle>
          </div>
          <p className="text-sm text-driftwood mb-3">{activeChallenges[0].description}</p>
          <div className="w-full bg-storm-grey/10 rounded-full h-3 mb-2">
            <div
              className="progress-bar h-3"
              style={{ width: `${Math.min(100, ((Number(activeChallenges[0].finalKm) || 0) / Number(activeChallenges[0].targetKm)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-driftwood">
            <span>{Number(activeChallenges[0].finalKm) || 0}km / {Number(activeChallenges[0].targetKm)}km</span>
            <span>
              {Math.round(((Number(activeChallenges[0].finalKm) || 0) / Number(activeChallenges[0].targetKm)) * 100)}%
            </span>
          </div>
        </Card>
      )}

      {/* My Stats */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">My Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Total Distance</p>
            <p className="stat-number text-xl">{totalDistance.toFixed(1)}km</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Total Paddles</p>
            <p className="stat-number text-xl">{totalPaddles}</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Time on Water</p>
            <p className="stat-number text-xl">{Math.round(totalMinutes / 60)}h</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">Longest Paddle</p>
            <p className="stat-number text-xl">{longestPaddle.toFixed(1)}km</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">This Month</p>
            <p className="stat-number text-xl">{monthDistance.toFixed(1)}km</p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-driftwood mb-0.5">This Year</p>
            <p className="stat-number text-xl">{yearDistance.toFixed(1)}km</p>
          </Card>
        </div>
      </div>

      <WaveDividerSubtle />

      {/* Recent Paddles */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">Recent Paddles</h2>
          <Link href="/paddles" className="text-xs text-atlantic-blue hover:underline">View all</Link>
        </div>
        {recentPaddles && recentPaddles.length > 0 ? (
          <div className="space-y-2">
            {recentPaddles.map((p) => {
              const paddle = p.paddle
              if (!paddle) return null
              const route = paddle.route
              return (
                <Link key={p.paddleId} href={`/paddles/${paddle.id}`}>
                  <Card hover padding="sm" className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-deep-ocean">{paddle.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {route && <TypeBadge type={route.type} size="sm" />}
                        <span className="text-xs text-driftwood">{formatRelativeDate(paddle.date)}</span>
                      </div>
                    </div>
                    <span className="stat-number text-sm">
                      {formatDistance(Number(p.distanceKm) || Number(paddle.distanceKm) || 0)}
                    </span>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No paddles yet"
            description="Time to get on the water! Log your first paddle to see your stats grow."
            action={{ label: 'Log a Paddle', href: '/paddles/new' }}
          />
        )}
      </div>

      <WaveDividerSubtle />

      {/* Group Activity Feed */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">Group Activity</h2>
        {groupActivity && groupActivity.length > 0 ? (
          <div className="space-y-2">
            {groupActivity.map((paddle) => {
              const participants = paddle.participants || []
              const names = participants.map(p => p.user?.name || 'Unknown').join(', ')
              const route = paddle.route
              return (
                <Link key={paddle.id} href={`/paddles/${paddle.id}`}>
                  <Card hover padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-storm-grey truncate">
                          <span className="font-semibold text-deep-ocean">{names}</span>
                          {' paddled '}
                          {route && <span className="font-medium">{route.name}</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {route && <TypeBadge type={route.type} size="sm" />}
                          <span className="text-xs text-driftwood">{formatRelativeDate(paddle.date)}</span>
                        </div>
                      </div>
                      {paddle.distanceKm && (
                        <span className="stat-number text-sm ml-2">{formatDistance(Number(paddle.distanceKm))}</span>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-driftwood text-center py-4">No group activity yet — be the first to log a paddle!</p>
          </Card>
        )}
      </div>
    </div>
  )
}

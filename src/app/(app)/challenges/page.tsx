import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDistance } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import Link from 'next/link'
import {
  Plus,
  Trophy,
  Target,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysRemaining(month: number, year: number): number {
  const now = new Date()
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)
  const diffMs = endOfMonth.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function getProgressPercentage(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

async function getChallengeProgress(challenge: {
  id: string
  month: number
  year: number
  targetKm: number | unknown
  routeFilter: Record<string, unknown> | unknown
}) {
  // Build date range for the challenge month
  const startDate = new Date(`${challenge.year}-${String(challenge.month).padStart(2, '0')}-01`)
  const endDate =
    challenge.month === 12
      ? new Date(`${challenge.year + 1}-01-01`)
      : new Date(`${challenge.year}-${String(challenge.month + 1).padStart(2, '0')}-01`)

  const routeFilter = challenge.routeFilter as Record<string, unknown> | null

  // Fetch completed paddles in this month/year
  const paddles = await prisma.paddle.findMany({
    where: {
      status: 'completed',
      date: {
        gte: startDate,
        lt: endDate,
      },
      ...(routeFilter?.type ? {
        route: { type: routeFilter.type as string },
      } : {}),
    },
    select: {
      id: true,
      title: true,
      date: true,
      distanceKm: true,
      routeId: true,
      route: { select: { id: true, name: true, type: true } },
      participants: {
        select: {
          id: true,
          userId: true,
          distanceKm: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  // If we have a route type filter, exclude paddles that didn't match
  const filteredPaddles = routeFilter?.type
    ? paddles.filter(
        (p) => p.route && p.route.type === routeFilter!.type
      )
    : paddles

  const totalKm = filteredPaddles.reduce(
    (sum, p) => sum + (Number(p.distanceKm) || 0),
    0
  )

  return {
    total_km: totalKm,
    contributing_paddles: filteredPaddles.map((p) => ({
      id: p.id,
      title: p.title,
      date: p.date,
      distance_km: Number(p.distanceKm) || 0,
      route: p.route,
      participant_count: p.participants?.length || 0,
    })),
  }
}

export default async function ChallengesPage() {
  await auth()

  const challenges = await prisma.challenge.findMany({
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  })

  const activeChallenges =
    challenges?.filter((c) => c.status === 'active') || []
  const completedChallenges =
    challenges?.filter((c) => c.status === 'completed') || []
  const missedChallenges =
    challenges?.filter((c) => c.status === 'missed') || []

  // Fetch progress for active challenges
  const activeWithProgress = await Promise.all(
    activeChallenges.map(async (challenge) => {
      const progress = await getChallengeProgress(challenge)
      return { ...challenge, progress }
    })
  )

  const hasAnyChallenges =
    activeChallenges.length > 0 ||
    completedChallenges.length > 0 ||
    missedChallenges.length > 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep-ocean">Challenges</h1>
        <Link href="/challenges/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Create Challenge
          </Button>
        </Link>
      </div>

      {!hasAnyChallenges && (
        <EmptyState
          icon={<Trophy className="w-10 h-10 text-driftwood/40" />}
          title="No challenges yet"
          description="Create one to rally the group!"
          action={{ label: 'Create a Challenge', href: '/challenges/new' }}
        />
      )}

      {/* Active Challenges */}
      {activeWithProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
            Active
          </h2>
          <div className="space-y-4">
            {activeWithProgress.map((challenge) => {
              const percentage = getProgressPercentage(
                challenge.progress.total_km,
                Number(challenge.targetKm)
              )
              const daysLeft = getDaysRemaining(
                challenge.month,
                challenge.year
              )
              const monthName = MONTH_NAMES[challenge.month - 1]

              const shareMessage = [
                `${challenge.title}`,
                `${challenge.progress.total_km.toFixed(1)}km / ${Number(challenge.targetKm)}km (${percentage}%)`,
                daysLeft > 0
                  ? `${daysLeft} days left in ${monthName}!`
                  : `Challenge month has ended.`,
                `Let's keep paddling!`,
              ].join('\n')

              return (
                <Card key={challenge.id} className="border-l-4 border-l-sunset-coral">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-sunset-coral" />
                        <CardTitle>{challenge.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-atlantic-blue bg-shallows/20 px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        {daysLeft > 0
                          ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                          : 'Final day'}
                      </div>
                    </div>
                  </CardHeader>

                  {challenge.description && (
                    <p className="text-sm text-driftwood mb-4">
                      {challenge.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-storm-grey/10 rounded-full h-4 mb-2 overflow-hidden">
                      <div
                        className="progress-bar h-4 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="stat-number text-lg">
                        {challenge.progress.total_km.toFixed(1)}km
                        <span className="text-sm font-normal text-driftwood">
                          {' '}/ {Number(challenge.targetKm)}km
                        </span>
                      </span>
                      <span className="text-sm font-bold text-atlantic-blue">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Month / Filter info */}
                  <div className="flex items-center gap-3 text-xs text-driftwood mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {monthName} {challenge.year}
                    </span>
                    {challenge.routeFilter &&
                      (challenge.routeFilter as Record<string, string>).type && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {(challenge.routeFilter as Record<string, string>).type}{' '}
                          routes only
                        </span>
                      )}
                  </div>

                  {/* Contributing Paddles */}
                  {challenge.progress.contributing_paddles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-storm-grey uppercase tracking-wide mb-2">
                        Contributing Paddles
                      </h4>
                      <div className="space-y-1.5">
                        {challenge.progress.contributing_paddles.map((paddle) => (
                          <Link
                            key={paddle.id}
                            href={`/paddles/${paddle.id}`}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-sand/50 hover:bg-sand transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-deep-ocean truncate">
                                {paddle.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-driftwood">
                                <span>{formatDate(paddle.date)}</span>
                                {paddle.route && (
                                  <span className="capitalize">
                                    {paddle.route.type}
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3" />
                                  {paddle.participant_count}
                                </span>
                              </div>
                            </div>
                            <span className="stat-number text-sm ml-2">
                              {formatDistance(paddle.distance_km)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {challenge.progress.contributing_paddles.length === 0 && (
                    <p className="text-sm text-driftwood/60 italic mb-4">
                      No completed paddles yet this month — get out there!
                    </p>
                  )}

                  {/* Share Button */}
                  <WhatsAppShare
                    message={shareMessage}
                    buttonText="Share Progress"
                    variant="outline"
                    size="sm"
                  />
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <>
          <WaveDividerSubtle />
          <section>
            <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
              Completed
            </h2>
            <div className="space-y-3">
              {completedChallenges.map((challenge) => {
                const percentage = getProgressPercentage(
                  Number(challenge.finalKm) || 0,
                  Number(challenge.targetKm)
                )
                return (
                  <Card key={challenge.id} padding="sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-kelp-green" />
                        <h3 className="font-semibold text-deep-ocean text-sm">
                          {challenge.title}
                        </h3>
                      </div>
                      <span className="badge-earned inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-kelp-green/10 text-kelp-green">
                        Completed
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-driftwood">
                        {MONTH_NAMES[challenge.month - 1]} {challenge.year}
                      </span>
                      <span className="stat-number">
                        {(Number(challenge.finalKm) || 0).toFixed(1)}km / {Number(challenge.targetKm)}km
                        <span className="text-xs text-kelp-green ml-1.5">
                          ({percentage}%)
                        </span>
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Missed Challenges */}
      {missedChallenges.length > 0 && (
        <>
          <WaveDividerSubtle />
          <section>
            <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
              Past Challenges
            </h2>
            <div className="space-y-3">
              {missedChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  padding="sm"
                  className="opacity-75"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-storm-grey text-sm">
                      {challenge.title}
                    </h3>
                    <span className="text-xs text-driftwood">
                      {MONTH_NAMES[challenge.month - 1]} {challenge.year}
                    </span>
                  </div>
                  <p className="text-sm text-driftwood">
                    We paddled{' '}
                    <span className="font-semibold text-storm-grey">
                      {(Number(challenge.finalKm) || 0).toFixed(1)}km
                    </span>{' '}
                    of {Number(challenge.targetKm)}km — solid effort!
                  </p>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

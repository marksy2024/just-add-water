import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDistance } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { TypeBadge, StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import Link from 'next/link'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default async function PaddlesPage() {
  const session = await auth()
  const userId = session!.user!.id!

  // Fetch all paddles with their routes and participant count
  const paddles = await prisma.paddle.findMany({
    include: {
      route: {
        select: { id: true, name: true, type: true, distanceKm: true },
      },
      participants: {
        select: {
          id: true,
          userId: true,
          role: true,
          rsvp: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  const upcomingPaddles = paddles.filter(
    (p) => p.status === 'planned' || p.status === 'active'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastPaddles = paddles.filter(
    (p) => p.status === 'completed'
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-deep-ocean">Paddles</h1>
        <div className="flex items-center gap-2">
          <Link href="/paddles/plan">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4" />
              Plan
            </Button>
          </Link>
          <Link href="/paddles/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Paddles */}
      <section>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          Upcoming
        </h2>
        {upcomingPaddles.length > 0 ? (
          <div className="space-y-3">
            {upcomingPaddles.map((paddle) => {
              const route = paddle.route
              const participants = paddle.participants || []
              const goingParticipants = participants.filter((p) => p.rsvp === 'going')
              const userParticipant = participants.find((p) => p.userId === userId)

              return (
                <Link key={paddle.id} href={`/paddles/${paddle.id}`}>
                  <Card hover>
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-deep-ocean truncate">
                            {paddle.title}
                          </h3>
                          <StatusBadge status={paddle.status} />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-driftwood">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(paddle.date)}
                          </span>
                          {paddle.startTime && (
                            <span className="text-storm-grey font-medium">
                              {paddle.startTime.slice(0, 5)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {route && (
                          <span className="flex items-center gap-1.5 text-sm text-storm-grey">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="font-medium">{route.name}</span>
                            <TypeBadge type={route.type} size="sm" />
                          </span>
                        )}
                        {(paddle.distanceKm || route?.distanceKm) && (
                          <span className="stat-number text-sm">
                            {formatDistance(Number(paddle.distanceKm) || Number(route?.distanceKm) || 0)}
                          </span>
                        )}
                      </div>

                      {/* Participant Avatars */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {goingParticipants.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              className="w-7 h-7 rounded-full border-2 border-salt-white bg-sea-foam flex items-center justify-center overflow-hidden"
                              title={p.user?.name || 'Paddler'}
                            >
                              {p.user?.image ? (
                                <img
                                  src={p.user.image}
                                  alt={p.user.name || ''}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-atlantic-blue">
                                  {(p.user?.name || '?').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                          {goingParticipants.length > 4 && (
                            <div className="w-7 h-7 rounded-full border-2 border-salt-white bg-storm-grey/10 flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-storm-grey">
                                +{goingParticipants.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                        {goingParticipants.length > 0 && (
                          <span className="text-xs text-driftwood">
                            {goingParticipants.length}
                          </span>
                        )}
                        {userParticipant?.rsvp === 'going' && (
                          <span className="text-[10px] font-semibold text-kelp-green bg-kelp-green/10 px-1.5 py-0.5 rounded-full">
                            You&apos;re in
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No upcoming paddles"
            description="Plan a group paddle or check back when one is proposed."
            action={{ label: 'Plan a Paddle', href: '/paddles/plan' }}
          />
        )}
      </section>

      <WaveDividerSubtle />

      {/* Past Paddles */}
      <section>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          Past Paddles
        </h2>
        {pastPaddles.length > 0 ? (
          <div className="space-y-2">
            {pastPaddles.map((paddle) => {
              const route = paddle.route
              const participants = paddle.participants || []

              return (
                <Link key={paddle.id} href={`/paddles/${paddle.id}`}>
                  <Card hover padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-deep-ocean truncate">
                          {paddle.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {route && (
                            <TypeBadge type={route.type} size="sm" />
                          )}
                          <span className="text-xs text-driftwood">
                            {formatDate(paddle.date)}
                          </span>
                          <span className="flex items-center gap-0.5 text-xs text-driftwood">
                            <Users className="w-3 h-3" />
                            {participants.length}
                          </span>
                        </div>
                      </div>
                      {paddle.distanceKm && (
                        <span className="stat-number text-sm ml-2">
                          {formatDistance(Number(paddle.distanceKm))}
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="No completed paddles yet"
            description="Log your first paddle to start building your history."
            action={{ label: 'Log a Paddle', href: '/paddles/new' }}
          />
        )}
      </section>
    </div>
  )
}

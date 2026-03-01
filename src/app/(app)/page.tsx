import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDashboardGreeting, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import { CalendarPlus, ClipboardPen, CalendarDays, User, MapPin, Calendar, Flame, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const userName = session!.user!.name || 'Paddler'

  const [
    nextPaddle,
    streak,
    overdueFloatPlans,
  ] = await Promise.all([
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
    prisma.userStreak.findFirst({
      where: { userId },
    }),
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

  const actions = [
    {
      href: '/paddles/plan',
      icon: CalendarPlus,
      label: 'Plan a Paddle',
      hint: 'Organise the next outing',
      color: 'bg-atlantic-blue',
      iconColor: 'text-atlantic-blue',
      bgTint: 'bg-atlantic-blue/10',
    },
    {
      href: '/paddles/new',
      icon: ClipboardPen,
      label: 'Log a Paddle',
      hint: 'Record a completed trip',
      color: 'bg-kelp-green',
      iconColor: 'text-kelp-green',
      bgTint: 'bg-kelp-green/10',
    },
    {
      href: '/calendar',
      icon: CalendarDays,
      label: 'Calendar',
      hint: "See what\u2019s coming up",
      color: 'bg-sunset-coral',
      iconColor: 'text-sunset-coral',
      bgTint: 'bg-sunset-coral/10',
    },
    {
      href: '/profile',
      icon: User,
      label: 'My Profile',
      hint: 'Stats, badges & settings',
      color: 'bg-deep-ocean',
      iconColor: 'text-deep-ocean',
      bgTint: 'bg-deep-ocean/10',
    },
  ]

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
                      {paddlers && ` \u2014 ${paddlers}`}
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

      {/* 4 Big Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card hover className="h-[140px] flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 rounded-2xl ${action.bgTint} flex items-center justify-center mb-2.5`}>
                <action.icon className={`w-7 h-7 ${action.iconColor}`} strokeWidth={1.8} />
              </div>
              <p className="font-bold text-deep-ocean text-sm">{action.label}</p>
              <p className="text-[11px] text-driftwood mt-0.5">{action.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

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
    </div>
  )
}

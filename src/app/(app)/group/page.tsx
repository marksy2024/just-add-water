import { prisma } from '@/lib/db'
import { formatDistance } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { Users, Heart, MapPin, Clock } from 'lucide-react'

// Avatar colour palette — consistent per user
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

export default async function GroupPage() {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Fetch all data in parallel
  const [
    users,
    allParticipations,
    allPaddles,
    routes,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, createdAt: true },
      orderBy: { name: 'asc' },
    }),
    prisma.paddleParticipant.findMany({
      where: { paddle: { status: 'completed' } },
      select: {
        userId: true,
        distanceKm: true,
        durationMinutes: true,
        paddle: { select: { id: true, date: true, status: true, distanceKm: true, routeId: true } },
      },
    }),
    prisma.paddle.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        date: true,
        status: true,
        distanceKm: true,
        routeId: true,
        route: { select: { name: true, type: true } },
        participants: { select: { userId: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.route.findMany({
      select: { id: true, name: true, type: true },
    }),
  ])

  // Build per-user stats
  const userStats: Record<string, { totalKm: number; totalPaddles: number; totalMinutes: number }> = {}
  for (const p of allParticipations) {
    const paddle = p.paddle
    if (!paddle || paddle.status !== 'completed') continue
    if (!userStats[p.userId]) {
      userStats[p.userId] = { totalKm: 0, totalPaddles: 0, totalMinutes: 0 }
    }
    userStats[p.userId].totalKm += Number(p.distanceKm) || Number(paddle.distanceKm) || 0
    userStats[p.userId].totalPaddles += 1
    userStats[p.userId].totalMinutes += p.durationMinutes || 0
  }

  // Group totals
  const groupTotalKm = Object.values(userStats).reduce((s, u) => s + u.totalKm, 0)
  const groupTotalPaddles = allPaddles?.length || 0
  const groupTotalHours = Math.round(
    Object.values(userStats).reduce((s, u) => s + u.totalMinutes, 0) / 60
  )

  // This month / this year totals
  const monthKm = allPaddles?.reduce((sum, p) => {
    const d = new Date(p.date)
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return sum + (Number(p.distanceKm) || 0)
    }
    return sum
  }, 0) || 0

  const yearKm = allPaddles?.reduce((sum, p) => {
    const d = new Date(p.date)
    if (d.getFullYear() === currentYear) {
      return sum + (Number(p.distanceKm) || 0)
    }
    return sum
  }, 0) || 0

  // Together vs solo paddles
  const groupPaddles = allPaddles?.filter(
    (p) => p.participants?.length >= 2
  ).length || 0
  const soloPaddles = groupTotalPaddles - groupPaddles

  // Monthly summary — last 6 months
  const monthlySummary: { label: string; km: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1)
    const mLabel = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    const mKm = allPaddles?.reduce((sum, p) => {
      const pd = new Date(p.date)
      if (pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()) {
        return sum + (Number(p.distanceKm) || 0)
      }
      return sum
    }, 0) || 0
    monthlySummary.push({ label: mLabel, km: mKm })
  }
  const maxMonthKm = Math.max(...monthlySummary.map((m) => m.km), 1)

  // Most popular routes
  const routeCounts: Record<string, number> = {}
  if (allPaddles) {
    for (const p of allPaddles) {
      if (p.routeId) {
        routeCounts[p.routeId] = (routeCounts[p.routeId] || 0) + 1
      }
    }
  }
  const routeMap = new Map(routes?.map((r) => [r.id, r]) || [])
  const popularRoutes = Object.entries(routeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([routeId, count]) => ({
      route: routeMap.get(routeId),
      count,
    }))
    .filter((r) => r.route)

  // WhatsApp summary message
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' })
  const summaryMessage = `Our group paddled ${monthKm.toFixed(1)}km in ${monthName}! ${groupPaddles} group paddles and ${groupTotalPaddles} total sessions. Keep it up! -- Just Add Water`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-deep-ocean">Our Group</h1>
        <p className="text-sm text-driftwood mt-0.5">
          Better together on the water
        </p>
      </div>

      {/* Group Totals */}
      <Card>
        <CardTitle className="mb-4">Group Totals</CardTitle>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-driftwood mb-0.5">This Month</p>
            <p className="stat-number text-xl">{monthKm.toFixed(1)}km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-driftwood mb-0.5">This Year</p>
            <p className="stat-number text-xl">{yearKm.toFixed(1)}km</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-driftwood mb-0.5">All Time</p>
            <p className="stat-number text-xl">{groupTotalKm.toFixed(1)}km</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-storm-grey/10">
          <div className="text-center">
            <p className="text-xs text-driftwood mb-0.5">Total Paddles</p>
            <p className="stat-number text-xl">{groupTotalPaddles}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-driftwood mb-0.5">Total Hours</p>
            <p className="stat-number text-xl">{groupTotalHours}h</p>
          </div>
        </div>
      </Card>

      {/* Paddle Together */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-sunset-coral" />
          <CardTitle>Paddle Together</CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-driftwood">Group paddles</span>
              <span className="text-xs font-semibold text-deep-ocean">{groupPaddles}</span>
            </div>
            <div className="w-full bg-storm-grey/10 rounded-full h-3">
              <div
                className="progress-bar h-3"
                style={{
                  width: `${groupTotalPaddles > 0 ? (groupPaddles / groupTotalPaddles) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-driftwood">Solo paddles</span>
              <span className="text-xs font-semibold text-deep-ocean">{soloPaddles}</span>
            </div>
            <div className="w-full bg-storm-grey/10 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-driftwood/40 transition-all duration-500"
                style={{
                  width: `${groupTotalPaddles > 0 ? (soloPaddles / groupTotalPaddles) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
        {groupPaddles > soloPaddles && (
          <p className="text-xs text-kelp-green mt-2 font-medium">
            More group paddles than solo -- that&apos;s the spirit!
          </p>
        )}
      </Card>

      <WaveDividerSubtle />

      {/* Members — alphabetical, NOT ranked */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Members ({users?.length || 0})
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {users?.map((user) => {
            const stats = userStats[user.id] || { totalKm: 0, totalPaddles: 0, totalMinutes: 0 }
            const initial = (user.name || user.email || '?').charAt(0).toUpperCase()
            const colorClass = getAvatarColor(user.name || user.email)

            return (
              <Card key={user.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}
                  >
                    <span className="text-white font-bold text-sm">{initial}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-deep-ocean truncate">
                      {user.name || 'Paddler'}
                    </p>
                    <p className="text-xs text-driftwood">
                      {formatDistance(stats.totalKm)} &middot; {stats.totalPaddles} paddle{stats.totalPaddles !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <WaveDividerSubtle />

      {/* Monthly Summary — styled bars */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Monthly Distance
          </h2>
        </div>
        <Card>
          <div className="space-y-3">
            {monthlySummary.map((month) => (
              <div key={month.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-driftwood font-medium">{month.label}</span>
                  <span className="text-xs font-semibold text-deep-ocean">
                    {month.km.toFixed(1)}km
                  </span>
                </div>
                <div className="w-full bg-storm-grey/10 rounded-full h-2.5">
                  <div
                    className="progress-bar h-2.5"
                    style={{ width: `${Math.max((month.km / maxMonthKm) * 100, month.km > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-storm-grey/10">
            <WhatsAppShare
              message={summaryMessage}
              buttonText="Share monthly summary"
            />
          </div>
        </Card>
      </div>

      {/* Most Popular Routes */}
      {popularRoutes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-atlantic-blue" />
            <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
              Most Popular Routes
            </h2>
          </div>
          <Card>
            <div className="space-y-2.5">
              {popularRoutes.map(({ route, count }) => {
                const r = route as { id: string; name: string; type: string }
                const typeColorMap: Record<string, string> = {
                  river: 'bg-paddle-river',
                  lake: 'bg-paddle-lake',
                  coastal: 'bg-paddle-coastal',
                  canal: 'bg-paddle-canal',
                }
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${typeColorMap[r.type] || 'bg-storm-grey'} shrink-0`} />
                    <span className="text-sm font-medium text-deep-ocean flex-1 truncate">
                      {r.name}
                    </span>
                    <span className="text-xs text-driftwood whitespace-nowrap">
                      {count} paddle{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

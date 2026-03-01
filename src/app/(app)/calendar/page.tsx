import { prisma } from '@/lib/db'
import { CalendarView } from '@/components/calendar/CalendarView'

export interface CalendarPaddle {
  id: string
  title: string
  date: string
  status: 'planned' | 'active' | 'completed'
  distance_km: number | null
  route_name: string | null
  route_type: 'river' | 'lake' | 'coastal' | 'canal' | null
  participant_count: number
}

export default async function CalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  // Fetch paddles for current month
  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`)
  const endDate = month === 12
    ? new Date(`${year + 1}-01-01`)
    : new Date(`${year}-${String(month + 1).padStart(2, '0')}-01`)

  const paddles = await prisma.paddle.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      id: true,
      title: true,
      date: true,
      status: true,
      distanceKm: true,
      route: { select: { name: true, type: true } },
      participants: { select: { userId: true } },
    },
    orderBy: { date: 'asc' },
  })

  const calendarPaddles: CalendarPaddle[] = paddles.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date as unknown as string,
    status: p.status as CalendarPaddle['status'],
    distance_km: p.distanceKm ? Number(p.distanceKm) : null,
    route_name: p.route?.name || null,
    route_type: (p.route?.type as CalendarPaddle['route_type']) || null,
    participant_count: p.participants?.length || 0,
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-deep-ocean">Calendar</h1>
        <p className="text-sm text-driftwood mt-0.5">
          Your paddling schedule at a glance
        </p>
      </div>
      <CalendarView
        initialPaddles={calendarPaddles}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')

  if (!yearParam || !monthParam) {
    return NextResponse.json({ error: 'year and month parameters are required' }, { status: 400 })
  }

  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 })
  }

  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`)
  const endDate = month === 12
    ? new Date(`${year + 1}-01-01`)
    : new Date(`${year}-${String(month + 1).padStart(2, '0')}-01`)

  try {
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
        route: {
          select: { name: true, type: true },
        },
        participants: {
          select: { userId: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    const calendarPaddles = paddles.map((p) => ({
      id: p.id,
      title: p.title,
      date: p.date,
      status: p.status,
      distance_km: p.distanceKm,
      route_name: p.route?.name || null,
      route_type: p.route?.type || null,
      participant_count: p.participants?.length || 0,
    }))

    return NextResponse.json({ paddles: calendarPaddles })
  } catch (err) {
    console.error('Calendar fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch paddles' }, { status: 500 })
  }
}

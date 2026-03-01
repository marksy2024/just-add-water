import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { id },
    })

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    // Build date range for the challenge month
    const startDate = new Date(`${challenge.year}-${String(challenge.month).padStart(2, '0')}-01`)
    const endDate = challenge.month === 12
      ? new Date(`${challenge.year + 1}-01-01`)
      : new Date(`${challenge.year}-${String(challenge.month + 1).padStart(2, '0')}-01`)

    // Fetch completed paddles in the date range with route and participant info
    const paddles = await prisma.paddle.findMany({
      where: {
        status: 'completed',
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        distanceKm: true,
        routeId: true,
        route: {
          select: { id: true, name: true, type: true },
        },
        participants: {
          select: {
            id: true,
            userId: true,
            distanceKm: true,
            durationMinutes: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Apply route_filter if present
    const routeFilter = challenge.routeFilter as Record<string, unknown> | null
    const filteredPaddles = routeFilter?.type
      ? paddles.filter(
          (p) => p.route && p.route.type === routeFilter.type
        )
      : paddles

    // Sum total distance
    const totalKm = filteredPaddles.reduce(
      (sum, p) => sum + (p.distanceKm ? Number(p.distanceKm) : 0),
      0
    )

    const targetKm = Number(challenge.targetKm)
    const percentage =
      targetKm > 0
        ? Math.min(100, Math.round((totalKm / targetKm) * 100))
        : 0

    const contributingPaddles = filteredPaddles.map((p) => ({
      id: p.id,
      title: p.title,
      date: p.date,
      distance_km: p.distanceKm ? Number(p.distanceKm) : 0,
      participants: (p.participants || []).map((part) => ({
        name: part.user?.name || 'Unknown',
        distance_km: part.distanceKm ? Number(part.distanceKm) : null,
        duration_minutes: part.durationMinutes,
      })),
    }))

    return NextResponse.json({
      total_km: totalKm,
      target_km: targetKm,
      percentage,
      contributing_paddles: contributingPaddles,
    })
  } catch (err) {
    console.error('Challenge progress error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch challenge progress' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params

  const offers = await prisma.shuttleOffer.findMany({
    where: { paddleId: id },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ offers })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id

  try {
    const body = await request.json()
    const { direction, seats_available = 1, pickup_location_notes } = body

    if (!direction || !['to_put_in', 'to_take_out', 'both'].includes(direction)) {
      return NextResponse.json(
        { error: 'Direction must be to_put_in, to_take_out, or both' },
        { status: 400 }
      )
    }

    const paddle = await prisma.paddle.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!paddle) {
      return NextResponse.json({ error: 'Paddle not found' }, { status: 404 })
    }

    const offer = await prisma.shuttleOffer.create({
      data: {
        paddleId: id,
        userId,
        direction,
        seatsAvailable: seats_available,
        pickupLocationNotes: pickup_location_notes || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/shuttle:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

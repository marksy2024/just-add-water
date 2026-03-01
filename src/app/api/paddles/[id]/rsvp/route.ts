import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: paddleId } = await params
  const userId = session.user.id

  try {
    const body = await req.json()
    const { rsvp } = body

    if (!['going', 'not_going', 'maybe'].includes(rsvp)) {
      return NextResponse.json(
        { error: 'Invalid RSVP value. Must be going, not_going, or maybe.' },
        { status: 400 }
      )
    }

    // Verify the paddle exists and is planned
    const paddle = await prisma.paddle.findUnique({
      where: { id: paddleId },
      select: { id: true, status: true },
    })

    if (!paddle) {
      return NextResponse.json(
        { error: 'Paddle not found' },
        { status: 404 }
      )
    }

    if (paddle.status !== 'planned') {
      return NextResponse.json(
        { error: 'Can only RSVP to planned paddles' },
        { status: 400 }
      )
    }

    // Check if the user already has a participant record
    const existing = await prisma.paddleParticipant.findUnique({
      where: {
        paddleId_userId: { paddleId, userId },
      },
      select: { id: true, role: true },
    })

    if (existing) {
      // Update existing RSVP
      const updated = await prisma.paddleParticipant.update({
        where: { id: existing.id },
        data: { rsvp },
      })

      return NextResponse.json({ participant: updated })
    } else {
      // Create new participant record
      const created = await prisma.paddleParticipant.create({
        data: {
          paddleId,
          userId,
          role: 'participant',
          rsvp,
        },
      })

      return NextResponse.json({ participant: created }, { status: 201 })
    }
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/rsvp:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

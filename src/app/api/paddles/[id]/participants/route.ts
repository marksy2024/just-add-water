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
  const callerId = session.user.id

  try {
    const body = await req.json()
    const { userId } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify the paddle exists
    const paddle = await prisma.paddle.findUnique({
      where: { id: paddleId },
      select: { id: true },
    })

    if (!paddle) {
      return NextResponse.json(
        { error: 'Paddle not found' },
        { status: 404 }
      )
    }

    // Verify caller is the organiser
    const organiser = await prisma.paddleParticipant.findFirst({
      where: { paddleId, userId: callerId, role: 'organiser' },
    })

    if (!organiser) {
      return NextResponse.json(
        { error: 'Only the organiser can add participants' },
        { status: 403 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already a participant
    const existing = await prisma.paddleParticipant.findUnique({
      where: { paddleId_userId: { paddleId, userId } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a participant' },
        { status: 409 }
      )
    }

    // Create participant
    const participant = await prisma.paddleParticipant.create({
      data: {
        paddleId,
        userId,
        role: 'participant',
        rsvp: 'going',
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    return NextResponse.json({ participant }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/participants:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
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
    const { distanceKm } = body

    if (distanceKm == null || isNaN(Number(distanceKm)) || Number(distanceKm) < 0) {
      return NextResponse.json(
        { error: 'distanceKm must be a non-negative number' },
        { status: 400 }
      )
    }

    const participant = await prisma.paddleParticipant.findUnique({
      where: { paddleId_userId: { paddleId, userId } },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this paddle' },
        { status: 404 }
      )
    }

    const updated = await prisma.paddleParticipant.update({
      where: { id: participant.id },
      data: { distanceKm: Number(distanceKm) },
    })

    return NextResponse.json({ participant: updated })
  } catch (err) {
    console.error('Error in PATCH /api/paddles/[id]/my-participation:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: paddleId } = await params
  const userId = session.user.id

  try {
    const participant = await prisma.paddleParticipant.findUnique({
      where: { paddleId_userId: { paddleId, userId } },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this paddle' },
        { status: 404 }
      )
    }

    await prisma.paddleParticipant.delete({
      where: { id: participant.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/paddles/[id]/my-participation:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

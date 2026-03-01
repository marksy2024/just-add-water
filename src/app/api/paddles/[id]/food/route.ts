import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VALID_CATEGORIES = ['bread', 'main', 'dessert', 'snacks', 'drinks']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const callerId = session.user.id

  try {
    const body = await request.json()
    const { userId, category } = body

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify paddle exists and is single-day
    const paddle = await prisma.paddle.findUnique({
      where: { id },
      select: { id: true, endDate: true },
    })

    if (!paddle) {
      return NextResponse.json({ error: 'Paddle not found' }, { status: 404 })
    }

    if (paddle.endDate) {
      return NextResponse.json(
        { error: 'Food allocation is only available for single-day paddles' },
        { status: 400 }
      )
    }

    // Verify caller is organiser
    const organiser = await prisma.paddleParticipant.findFirst({
      where: { paddleId: id, userId: callerId, role: 'organiser' },
    })

    if (!organiser) {
      return NextResponse.json(
        { error: 'Only the organiser can manage food allocations' },
        { status: 403 }
      )
    }

    // Toggle: if exists → delete, if not → create
    const existing = await prisma.foodAllocation.findUnique({
      where: {
        paddleId_userId_category: { paddleId: id, userId, category },
      },
    })

    if (existing) {
      await prisma.foodAllocation.delete({ where: { id: existing.id } })
      return NextResponse.json({ action: 'removed', category })
    }

    await prisma.foodAllocation.create({
      data: { paddleId: id, userId, category },
    })

    return NextResponse.json({ action: 'added', category }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/food:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

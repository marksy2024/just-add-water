import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateStreak } from '@/lib/streaks'
import { evaluateBadges } from '@/lib/badges'

interface NewBadge {
  id: string
  badge: {
    id: string
    slug: string
    name: string
    description: string
    icon: string
    category: string
    criteria: unknown
    sortOrder: number
  }
  earnedAt: Date
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch the paddle to verify it exists and is not already completed
    const paddle = await prisma.paddle.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!paddle) {
      return NextResponse.json({ error: 'Paddle not found' }, { status: 404 })
    }

    if (paddle.status === 'completed') {
      return NextResponse.json(
        { error: 'Paddle is already completed' },
        { status: 400 }
      )
    }

    // Update paddle status to completed
    const updatedPaddle = await prisma.paddle.update({
      where: { id },
      data: { status: 'completed' },
    })

    // Fetch all participants for this paddle
    const participants = await prisma.paddleParticipant.findMany({
      where: { paddleId: id },
      select: { userId: true },
    })

    // Update streaks and evaluate badges for each participant
    const allNewBadges: Array<NewBadge & { user_id: string }> = []

    if (participants && participants.length > 0) {
      const uniqueUserIds = [...new Set(participants.map((p) => p.userId))]

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          // Update streak first since badge evaluation may depend on it
          await updateStreak(userId)
          const newBadges = await evaluateBadges(userId)
          for (const badge of newBadges) {
            allNewBadges.push({ ...badge, user_id: userId })
          }
        })
      )
    }

    return NextResponse.json({
      paddle: updatedPaddle,
      new_badges: allNewBadges,
    })
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/complete:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

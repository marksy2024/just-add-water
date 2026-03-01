import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: paddleId } = await params

  try {
    const comments = await prisma.paddleComment.findMany({
      where: { paddleId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ comments })
  } catch (err) {
    console.error('Error fetching comments:', err)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

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
    const { text, comment_type = 'general' } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      )
    }

    const validTypes = ['general', 'hazard', 'access', 'tip']
    if (!validTypes.includes(comment_type)) {
      return NextResponse.json(
        { error: 'Invalid comment type' },
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

    // Create the comment
    const comment = await prisma.paddleComment.create({
      data: {
        paddleId,
        userId,
        text: text.trim(),
        commentType: comment_type,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/paddles/[id]/comments:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

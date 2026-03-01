import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const comments = await prisma.routeComment.findMany({
      where: { routeId: id },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(comments)
  } catch (err) {
    console.error('Comments fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const { text, comment_type } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      )
    }

    // Validate comment_type enum
    const validTypes = ['general', 'hazard', 'access', 'conditions', 'tip']
    const type = validTypes.includes(comment_type) ? comment_type : 'general'

    // Verify the route exists
    const route = await prisma.route.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.routeComment.create({
      data: {
        routeId: id,
        userId: session.user.id,
        text: text.trim(),
        commentType: type,
        pinned: false,
      },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error('Comment API error:', err)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

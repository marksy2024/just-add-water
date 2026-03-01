import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const floatPlan = await prisma.floatPlan.findFirst({
    where: { paddleId: id, status: { in: ['active', 'overdue'] } },
    orderBy: { activatedAt: 'desc' },
  })

  if (!floatPlan) {
    return NextResponse.json(null)
  }

  const isOverdue = floatPlan.status === 'active' && new Date() > floatPlan.expectedReturnTime

  return NextResponse.json({
    ...floatPlan,
    isOverdue,
  })
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const body = await req.json()

  const { expectedReturnTime, emergencyContactName, emergencyContactPhone } = body

  if (!expectedReturnTime || !emergencyContactName || !emergencyContactPhone) {
    return NextResponse.json(
      { error: 'expectedReturnTime, emergencyContactName, and emergencyContactPhone are required' },
      { status: 400 }
    )
  }

  // Check paddle exists
  const paddle = await prisma.paddle.findUnique({ where: { id } })
  if (!paddle) {
    return NextResponse.json({ error: 'Paddle not found' }, { status: 404 })
  }

  const floatPlan = await prisma.floatPlan.create({
    data: {
      paddleId: id,
      expectedReturnTime: new Date(expectedReturnTime),
      emergencyContactName,
      emergencyContactPhone,
    },
  })

  return NextResponse.json(floatPlan, { status: 201 })
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const floatPlan = await prisma.floatPlan.findFirst({
    where: { paddleId: id, status: { in: ['active', 'overdue'] } },
    orderBy: { activatedAt: 'desc' },
  })

  if (!floatPlan) {
    return NextResponse.json({ error: 'No active float plan found' }, { status: 404 })
  }

  const updated = await prisma.floatPlan.update({
    where: { id: floatPlan.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}

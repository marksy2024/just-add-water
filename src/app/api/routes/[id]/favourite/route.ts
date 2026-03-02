import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: routeId } = await params
  const userId = session.user.id

  // Toggle: delete if exists, create if not
  const existing = await prisma.favouriteRoute.findUnique({
    where: { userId_routeId: { userId, routeId } },
  })

  if (existing) {
    await prisma.favouriteRoute.delete({ where: { id: existing.id } })
    return NextResponse.json({ favourited: false })
  }

  await prisma.favouriteRoute.create({ data: { userId, routeId } })
  return NextResponse.json({ favourited: true })
}

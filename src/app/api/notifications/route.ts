import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
  })

  return NextResponse.json({ notifications })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json()

  if (body.all) {
    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    })
    return NextResponse.json({ deleted: 'all' })
  }

  if (body.id) {
    await prisma.notification.deleteMany({
      where: { id: body.id, userId: session.user.id },
    })
    return NextResponse.json({ deleted: body.id })
  }

  return NextResponse.json({ error: 'Missing id or all' }, { status: 400 })
}

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
    const photos = await prisma.paddlePhoto.findMany({
      where: { paddleId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ photos })
  } catch (err) {
    console.error('Error fetching photos:', err)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

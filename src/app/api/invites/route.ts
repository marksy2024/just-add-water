import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate a secure invite token
    const token = crypto.randomBytes(24).toString('hex')

    // Expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.invite.create({
      data: {
        token,
        inviterId: session.user.id,
        inviteeName: name.trim(),
        inviteeEmail: email?.trim() || null,
        status: 'pending',
        expiresAt,
      },
    })

    // Build the invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const inviteLink = `${baseUrl}/join/${invite.token}`

    return NextResponse.json({ inviteLink, token: invite.token })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

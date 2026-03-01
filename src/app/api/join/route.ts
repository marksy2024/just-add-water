import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name, email } = body

    if (!token || !name || !email) {
      return NextResponse.json(
        { error: 'Token, name, and email are required' },
        { status: 400 }
      )
    }

    // Validate the invite
    const invite = await prisma.invite.findFirst({
      where: {
        token,
        status: 'pending',
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
    }

    // Check if invite has expired
    if (new Date(invite.expiresAt) < new Date()) {
      // Mark as expired
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      })

      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    // Check if a user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    })

    if (existingUser) {
      // Mark invite as accepted anyway
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Account already exists. Please sign in.',
        redirect: '/login',
      })
    }

    // Create the user account
    try {
      await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
      })
    } catch (userErr) {
      console.error('User creation error:', userErr)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Mark invite as accepted
    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Account created successfully',
      redirect: '/login',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

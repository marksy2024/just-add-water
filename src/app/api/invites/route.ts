import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    // Generate random password (8 hex chars)
    const plainPassword = crypto.randomBytes(4).toString('hex')
    const passwordHash = await bcrypt.hash(plainPassword, 10)

    // Create user
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        passwordHash,
      },
    })

    // Create invite record for tracking
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.invite.create({
      data: {
        token: crypto.randomUUID(),
        inviterId: session.user.id,
        inviteeName: name.trim(),
        inviteeEmail: trimmedEmail,
        status: 'accepted',
        expiresAt,
        acceptedAt: new Date(),
      },
    })

    // Send welcome email with credentials
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jaw.wearesmc.co.uk'

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Just Add Water <noreply@jaw.wearesmc.co.uk>',
      to: trimmedEmail,
      subject: 'Welcome to Just Add Water 🛶',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0C4A6E; font-size: 24px; margin: 0;">Just Add Water</h1>
            <p style="color: #78716C; font-size: 14px; margin: 8px 0 0;">Your paddling group companion</p>
          </div>
          <div style="background: #FAFAF9; border-radius: 14px; padding: 32px;">
            <p style="color: #475569; font-size: 16px; margin: 0 0 16px;">
              Hi ${name.trim()}, you've been invited to join Just Add Water!
            </p>
            <p style="color: #475569; font-size: 16px; margin: 0 0 8px;">
              Here are your login details:
            </p>
            <div style="background: #fff; border: 1px solid #E7E5E4; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">
                <strong>Email:</strong> ${trimmedEmail}
              </p>
              <p style="color: #475569; font-size: 14px; margin: 0;">
                <strong>Password:</strong> ${plainPassword}
              </p>
            </div>
            <p style="color: #475569; font-size: 14px; margin: 0 0 24px;">
              You can change your password after signing in from your profile page.
            </p>
            <div style="text-align: center;">
              <a href="${appUrl}/login" style="display: inline-block; background: #0C4A6E; color: #fff; font-weight: 600; font-size: 16px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                Sign In
              </a>
            </div>
          </div>
          <p style="color: #78716C; font-size: 12px; text-align: center; margin-top: 24px;">
            If you weren't expecting this email, you can safely ignore it.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

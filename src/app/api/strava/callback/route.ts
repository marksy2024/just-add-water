import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { exchangeStravaCode } from '@/lib/strava'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/profile?strava=error', req.url))
  }

  try {
    const tokens = await exchangeStravaCode(code)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stravaAthleteId: tokens.athlete.id,
        stravaAccessToken: tokens.access_token,
        stravaRefreshToken: tokens.refresh_token,
        stravaTokenExpiresAt: new Date(tokens.expires_at * 1000),
      },
    })

    return NextResponse.redirect(new URL('/profile?strava=connected', req.url))
  } catch (err) {
    console.error('Strava OAuth error:', err)
    return NextResponse.redirect(new URL('/profile?strava=error', req.url))
  }
}

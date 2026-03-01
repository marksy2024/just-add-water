import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchStravaActivity, isPaddlingActivity, refreshStravaToken } from '@/lib/strava'

/**
 * GET — Strava webhook validation challenge
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST — Strava webhook event handler
 */
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Only process new/updated activities
  if (body.object_type !== 'activity' || body.aspect_type === 'delete') {
    return NextResponse.json({ ok: true })
  }

  const athleteId = body.owner_id
  const activityId = body.object_id

  try {
    // Find the user with this Strava athlete ID
    const user = await prisma.user.findFirst({
      where: { stravaAthleteId: BigInt(athleteId) },
    })

    if (!user || !user.stravaAccessToken || !user.stravaRefreshToken) {
      return NextResponse.json({ ok: true })
    }

    // Check if token needs refresh
    let accessToken = user.stravaAccessToken
    if (user.stravaTokenExpiresAt && new Date() > user.stravaTokenExpiresAt) {
      const refreshed = await refreshStravaToken(user.stravaRefreshToken)
      accessToken = refreshed.access_token

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stravaAccessToken: refreshed.access_token,
          stravaRefreshToken: refreshed.refresh_token,
          stravaTokenExpiresAt: new Date(refreshed.expires_at * 1000),
        },
      })
    }

    // Fetch the activity details
    const activity = await fetchStravaActivity(accessToken, activityId)

    // Only process paddling activities
    if (!isPaddlingActivity(activity.type, activity.sport_type)) {
      return NextResponse.json({ ok: true })
    }

    // Check if we already have a paddle for this Strava activity
    const existing = await prisma.paddleParticipant.findFirst({
      where: {
        userId: user.id,
        stravaActivityId: activityId.toString(),
      },
    })

    if (existing) {
      return NextResponse.json({ ok: true })
    }

    // Create a draft paddle from the Strava activity
    const distanceKm = Math.round((activity.distance / 1000) * 100) / 100
    const durationMinutes = Math.round(activity.moving_time / 60)
    const activityDate = new Date(activity.start_date)

    const paddle = await prisma.paddle.create({
      data: {
        title: activity.name,
        date: activityDate,
        status: 'completed',
        distanceKm,
        createdBy: user.id,
        notes: `Imported from Strava`,
      },
    })

    // Add the user as a participant
    await prisma.paddleParticipant.create({
      data: {
        paddleId: paddle.id,
        userId: user.id,
        role: 'organiser',
        rsvp: 'going',
        stravaActivityId: activityId.toString(),
        distanceKm,
        durationMinutes,
      },
    })

    return NextResponse.json({ ok: true, paddleId: paddle.id })
  } catch (err) {
    console.error('Strava webhook error:', err)
    return NextResponse.json({ ok: true }) // Always return 200 for webhooks
  }
}

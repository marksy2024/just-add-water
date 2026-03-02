import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { fetchStravaActivities, isPaddlingActivity, refreshStravaToken } from '@/lib/strava'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      stravaAccessToken: true,
      stravaRefreshToken: true,
      stravaTokenExpiresAt: true,
    },
  })

  if (!user?.stravaAccessToken || !user?.stravaRefreshToken) {
    return NextResponse.json({ error: 'Strava not connected' }, { status: 400 })
  }

  // Refresh token if expired
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

  // Fetch activities from the last 30 days
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const activities = await fetchStravaActivities(accessToken, thirtyDaysAgo)

  // Filter to paddling activities only
  const paddleActivities = activities.filter((a) =>
    isPaddlingActivity(a.type, a.sport_type)
  )

  // Get existing Strava activity IDs to avoid duplicates
  const existingIds = new Set(
    (await prisma.paddleParticipant.findMany({
      where: {
        userId: user.id,
        stravaActivityId: { not: null },
      },
      select: { stravaActivityId: true },
    })).map((p) => p.stravaActivityId)
  )

  let imported = 0

  for (const activity of paddleActivities) {
    if (existingIds.has(activity.id.toString())) continue

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
        notes: 'Imported from Strava',
      },
    })

    await prisma.paddleParticipant.create({
      data: {
        paddleId: paddle.id,
        userId: user.id,
        role: 'organiser',
        rsvp: 'going',
        stravaActivityId: activity.id.toString(),
        distanceKm,
        durationMinutes,
      },
    })

    imported++
  }

  return NextResponse.json({ imported, total: paddleActivities.length })
}

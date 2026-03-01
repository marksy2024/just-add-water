import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateStreak } from '@/lib/streaks'
import { evaluateBadges } from '@/lib/badges'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await req.json()
    const {
      title,
      date,
      end_date,
      route_id,
      status = 'completed',
      start_time,
      distance_km,
      duration_minutes,
      notes,
      participant_ids,
    } = body

    // Validate required fields
    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      )
    }

    if (!['planned', 'active', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Validate end_date if provided
    if (end_date && new Date(end_date) < new Date(date)) {
      return NextResponse.json(
        { error: 'End date must be on or after start date' },
        { status: 400 }
      )
    }

    // Create the paddle
    const paddle = await prisma.paddle.create({
      data: {
        title: title.trim(),
        date: new Date(date),
        endDate: end_date ? new Date(end_date) : null,
        routeId: route_id || null,
        status,
        startTime: start_time || null,
        endTime: start_time && duration_minutes
          ? (() => {
              const [h, m] = start_time.split(':').map(Number)
              const totalMin = h * 60 + m + duration_minutes
              const endH = Math.floor(totalMin / 60) % 24
              const endM = totalMin % 60
              return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
            })()
          : null,
        distanceKm: distance_km || null,
        notes: notes || null,
        createdBy: userId,
      },
    })

    // Add the user as organiser and participant
    try {
      await prisma.paddleParticipant.create({
        data: {
          paddleId: paddle.id,
          userId,
          role: 'organiser',
          rsvp: 'going',
          distanceKm: status === 'completed' ? (distance_km || null) : null,
          durationMinutes: status === 'completed' ? (duration_minutes || null) : null,
        },
      })
    } catch (participantErr) {
      console.error('Error adding participant:', participantErr)
      // Paddle was created but participant failed; still return paddle
    }

    // Add additional participants if provided
    if (Array.isArray(participant_ids) && participant_ids.length > 0) {
      const idsToAdd = participant_ids.filter((id: string) => id !== userId)
      if (idsToAdd.length > 0) {
        try {
          await prisma.paddleParticipant.createMany({
            data: idsToAdd.map((id: string) => ({
              paddleId: paddle.id,
              userId: id,
              role: 'participant',
              rsvp: 'going',
            })),
            skipDuplicates: true,
          })
        } catch (e) {
          console.error('Error adding participants:', e)
        }
      }
    }

    // If logging a completed paddle, update streak and check badges
    let newBadges: Array<{ id: string; badge: unknown; earnedAt: Date }> = []
    if (status === 'completed') {
      try {
        await updateStreak(userId)
        newBadges = await evaluateBadges(userId)
      } catch (e) {
        console.error('Error updating streak/badges:', e)
      }
    }

    return NextResponse.json({ paddle, new_badges: newBadges }, { status: 201 })
  } catch (err) {
    console.error('Error in POST /api/paddles:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

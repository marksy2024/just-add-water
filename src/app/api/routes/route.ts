import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const routes = await prisma.route.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(routes)
  } catch (err) {
    console.error('Route list error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const {
      name,
      type,
      difficulty,
      distance_km,
      description,
      put_in_description,
      put_in_lat,
      put_in_lng,
      take_out_description,
      take_out_lat,
      take_out_lng,
      best_season_notes,
      hubeau_station_code,
      min_water_level_notes,
    } = body

    // Validate required fields
    if (!name || !type || !difficulty) {
      return NextResponse.json(
        { error: 'Name, type, and difficulty are required' },
        { status: 400 }
      )
    }

    // Validate type enum
    if (!['river', 'lake', 'coastal', 'canal'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be one of: river, lake, coastal, canal' },
        { status: 400 }
      )
    }

    // Validate difficulty enum
    if (!['easy', 'moderate', 'challenging'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Difficulty must be one of: easy, moderate, challenging' },
        { status: 400 }
      )
    }

    const route = await prisma.route.create({
      data: {
        name: name.trim(),
        type,
        difficulty,
        distanceKm: distance_km || null,
        description: description || null,
        putInDescription: put_in_description || null,
        putInLat: put_in_lat || null,
        putInLng: put_in_lng || null,
        takeOutDescription: take_out_description || null,
        takeOutLat: take_out_lat || null,
        takeOutLng: take_out_lng || null,
        bestSeasonNotes: best_season_notes || null,
        hubeauStationCode: hubeau_station_code || null,
        minWaterLevelNotes: min_water_level_notes || null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(route, { status: 201 })
  } catch (err) {
    console.error('Route API error:', err)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

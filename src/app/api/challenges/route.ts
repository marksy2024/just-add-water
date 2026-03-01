import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    })

    return NextResponse.json({ challenges })
  } catch (err) {
    console.error('Challenges fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, target_km, month, year, route_filter } = body

    // Validate required fields
    if (!title || !target_km || !month || !year) {
      return NextResponse.json(
        { error: 'Title, target distance, month, and year are required' },
        { status: 400 }
      )
    }

    if (target_km <= 0) {
      return NextResponse.json(
        { error: 'Target distance must be greater than zero' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        targetKm: target_km,
        month,
        year,
        routeFilter: route_filter || null,
        status: 'active',
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ challenge }, { status: 201 })
  } catch (err) {
    console.error('Challenge creation error:', err)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { gpxToGeojson } from '@/lib/gpx'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const text = await file.text()

  try {
    const result = gpxToGeojson(text)

    return NextResponse.json({
      name: result.name,
      geojson: result.geojson,
      distanceKm: result.distanceKm,
      putIn: result.putIn,
      takeOut: result.takeOut,
    })
  } catch (err) {
    console.error('GPX parse error:', err)
    return NextResponse.json(
      { error: 'Failed to parse GPX file' },
      { status: 400 }
    )
  }
}

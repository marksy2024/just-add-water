import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { geojsonToGpx } from '@/lib/gpx'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const route = await prisma.route.findUnique({
    where: { id },
    select: { name: true, geojson: true },
  })

  if (!route) {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 })
  }

  if (!route.geojson) {
    return NextResponse.json({ error: 'Route has no GPS data' }, { status: 404 })
  }

  const gpx = geojsonToGpx(route.geojson as Record<string, unknown>, route.name)

  const fileName = route.name.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase()

  return new NextResponse(gpx, {
    status: 200,
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename="${fileName}.gpx"`,
    },
  })
}

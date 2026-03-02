import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getWaterLevel } from '@/lib/water-level'
import type { WaterLevelData } from '@/lib/water-level'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { RouteFilters } from './RouteFilters'

// Department bounding boxes for coordinate-based filtering
const DEPARTMENT_BOUNDS: Record<string, { south: number; west: number; north: number; east: number }> = {
  'Vendée':             { south: 46.27, west: -2.40, north: 47.08, east: -0.54 },
  'Deux-Sèvres':       { south: 45.96, west: -0.73, north: 47.11, east: 0.24 },
  'Loire-Atlantique':   { south: 46.86, west: -2.56, north: 47.84, east: -0.92 },
  'Maine-et-Loire':     { south: 47.06, west: -1.35, north: 47.81, east: 0.24 },
  'Vienne':             { south: 46.06, west: -0.06, north: 47.18, east: 1.21 },
  'Charente':           { south: 45.19, west: -0.47, north: 46.14, east: 0.95 },
  'Charente-Maritime':  { south: 45.08, west: -1.56, north: 46.37, east: -0.06 },
}

function getDepartment(lat: number, lng: number): string | null {
  for (const [name, bounds] of Object.entries(DEPARTMENT_BOUNDS)) {
    if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
      return name
    }
  }
  return null
}

export default async function RoutesPage() {
  const session = await auth()
  const userId = session?.user?.id

  const routes = await prisma.route.findMany({
    include: {
      creator: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Fetch paddle counts per route
  const routeIds = routes.map((r) => r.id)
  let paddleCounts: Record<string, number> = {}

  if (routeIds.length > 0) {
    const paddles = await prisma.paddle.findMany({
      where: { routeId: { in: routeIds } },
      select: { routeId: true },
    })
    paddleCounts = paddles.reduce((acc, p) => {
      if (p.routeId) {
        acc[p.routeId] = (acc[p.routeId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }

  // Fetch user's favourite route IDs
  const favouriteRouteIds = new Set(
    userId
      ? (await prisma.favouriteRoute.findMany({
          where: { userId },
          select: { routeId: true },
        })).map((f) => f.routeId)
      : []
  )

  // Batch-fetch water levels for routes with Hub'Eau station codes
  const stationCodes = [...new Set(
    routes
      .map((r) => r.hubeauStationCode)
      .filter((code): code is string => !!code)
  )]

  const waterLevelResults = await Promise.allSettled(
    stationCodes.map((code) => getWaterLevel(code))
  )

  const waterLevels: Record<string, WaterLevelData> = {}
  stationCodes.forEach((code, i) => {
    const result = waterLevelResults[i]
    if (result.status === 'fulfilled' && result.value) {
      waterLevels[code] = result.value
    }
  })

  // Serialize for client component
  const serializedRoutes = routes.map((route) => {
    const lat = route.putInLat ? Number(route.putInLat) : null
    const lng = route.putInLng ? Number(route.putInLng) : null
    return {
      id: route.id,
      name: route.name,
      type: route.type,
      difficulty: route.difficulty,
      distanceKm: route.distanceKm ? Number(route.distanceKm) : null,
      putInLat: lat,
      putInLng: lng,
      putInDescription: route.putInDescription,
      bestSeasonNotes: route.bestSeasonNotes,
      hubeauStationCode: route.hubeauStationCode,
      department: lat && lng ? getDepartment(lat, lng) : null,
      paddleCount: paddleCounts[route.id] || 0,
      creatorName: route.creator?.name || null,
      isFavourite: favouriteRouteIds.has(route.id),
    }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-deep-ocean">Routes</h1>
          <p className="text-sm text-driftwood mt-0.5">
            Discover and manage paddling routes
          </p>
        </div>
        <Link href="/routes/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Route
          </Button>
        </Link>
      </div>

      <RouteFilters
        routes={serializedRoutes}
        waterLevels={waterLevels}
      />
    </div>
  )
}

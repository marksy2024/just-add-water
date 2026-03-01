import { prisma } from '@/lib/db'
import { getWaterLevel } from '@/lib/water-level'
import type { WaterLevelData } from '@/lib/water-level'
import { DiscoverFilters } from './DiscoverFilters'

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

export default async function DiscoverPage() {
  const routes = await prisma.route.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      difficulty: true,
      distanceKm: true,
      putInLat: true,
      putInLng: true,
      putInDescription: true,
      bestSeasonNotes: true,
      hubeauStationCode: true,
    },
  })

  // Batch-fetch water levels for routes that have Hub'Eau station codes
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

  // Derive department for each route from coordinates
  const routesWithDepartment = routes.map((route) => {
    const lat = route.putInLat ? Number(route.putInLat) : null
    const lng = route.putInLng ? Number(route.putInLng) : null
    const department = lat && lng ? getDepartment(lat, lng) : null
    return {
      ...route,
      // Serialize Decimal fields for client component
      distanceKm: route.distanceKm ? Number(route.distanceKm) : null,
      putInLat: route.putInLat ? Number(route.putInLat) : null,
      putInLng: route.putInLng ? Number(route.putInLng) : null,
      department,
    }
  })

  return (
    <div className="space-y-4">
      <DiscoverFilters
        routes={routesWithDepartment}
        waterLevels={waterLevels}
      />
    </div>
  )
}

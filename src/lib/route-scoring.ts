import { assessConditions, type ConditionLevel } from '@/lib/conditions'
import type { WeatherForecast } from '@/lib/weather'
import type { WaterLevelData } from '@/lib/water-level'
import type { SunTimes } from '@/lib/sun'

// --- Types ---

export interface RouteScoreInput {
  route: {
    id: string
    name: string
    type: string
    distanceKm: number | null
    putInLat: number | null
    putInLng: number | null
    takeOutLat: number | null
    takeOutLng: number | null
    geojson: unknown
    bestSeasonNotes: string | null
  }
  weather: WeatherForecast | null
  waterLevel: WaterLevelData | null
  sunTimes: SunTimes | null
}

export interface RouteScore {
  routeId: string
  routeName: string
  routeType: string
  score: number // 0–100
  reasons: string[]
}

// --- Helpers ---

/** Calculate bearing (degrees) from point A to point B */
function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI

  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Extract first/last coordinates from GeoJSON */
function bearingFromGeojson(geojson: unknown): number | null {
  try {
    const gj = geojson as { type?: string; features?: unknown[]; geometry?: { type?: string; coordinates?: number[][] }; coordinates?: number[][] }
    let coords: number[][] | undefined

    if (gj.type === 'FeatureCollection' && gj.features?.length) {
      const firstFeature = gj.features[0] as { geometry?: { coordinates?: number[][] } }
      coords = firstFeature.geometry?.coordinates
    } else if (gj.type === 'Feature') {
      const feat = gj as { geometry?: { coordinates?: number[][] } }
      coords = feat.geometry?.coordinates
    } else if (gj.coordinates) {
      coords = gj.coordinates
    }

    if (coords && coords.length >= 2) {
      const first = coords[0]
      const last = coords[coords.length - 1]
      // GeoJSON is [lng, lat]
      return calculateBearing(first[1], first[0], last[1], last[0])
    }
  } catch {
    // ignore malformed geojson
  }
  return null
}

/** Parse dayLength string (HH:MM:SS or seconds) to hours */
function parseDayLengthHours(dayLength: string): number {
  // Try HH:MM:SS format
  const parts = dayLength.split(':')
  if (parts.length === 3) {
    return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60 + parseInt(parts[2], 10) / 3600
  }
  // Try as raw seconds
  const secs = parseFloat(dayLength)
  if (!isNaN(secs)) return secs / 3600
  return 12 // fallback
}

/** Month name lookup (case-insensitive, supports abbreviations) */
const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

/** Parse bestSeasonNotes to extract month range, e.g. "April to October" or "May-Sept" */
function parseSeasonMonths(notes: string): { start: number; end: number } | null {
  const lower = notes.toLowerCase()
  // Match patterns like "april to october", "may-sept", "march through november"
  const match = lower.match(/([a-z]+)\s*(?:to|[-–—]|through)\s*([a-z]+)/)
  if (match) {
    const start = MONTH_NAMES[match[1]]
    const end = MONTH_NAMES[match[2]]
    if (start !== undefined && end !== undefined) {
      return { start, end }
    }
  }
  return null
}

/** Check if a month is within or adjacent to a season range */
function seasonScore(currentMonth: number, notes: string | null): number {
  if (!notes) return 2 // no data = neutral

  const range = parseSeasonMonths(notes)
  if (!range) return 2 // couldn't parse = neutral

  const { start, end } = range

  // Handle wrap-around seasons (e.g., Nov-Mar)
  const inRange = start <= end
    ? currentMonth >= start && currentMonth <= end
    : currentMonth >= start || currentMonth <= end

  if (inRange) return 3

  // Adjacent month check (1 month before start or after end)
  const adjacentStart = (start - 1 + 12) % 12
  const adjacentEnd = (end + 1) % 12
  if (currentMonth === adjacentStart || currentMonth === adjacentEnd) return 1

  return 0
}

// --- Scoring ---

const CONDITION_SCORES: Record<ConditionLevel, number> = { green: 3, amber: 2, red: 1 }

export function scoreRoute(input: RouteScoreInput): RouteScore {
  const { route, weather, waterLevel, sunTimes } = input
  const reasons: string[] = []

  // Determine if wind alignment applies (skip for lakes/loops)
  const isLoop = route.type === 'lake' || (
    route.putInLat != null && route.takeOutLat != null &&
    Math.abs(route.putInLat - route.takeOutLat) < 0.001 &&
    route.putInLng != null && route.takeOutLng != null &&
    Math.abs(route.putInLng - route.takeOutLng) < 0.001
  )

  // Factor weights — redistribute wind weight for loops/lakes
  const weights = isLoop
    ? { conditions: 0.35, wind: 0, daylight: 0.25, water: 0.20, season: 0.20 }
    : { conditions: 0.30, wind: 0.20, daylight: 0.20, water: 0.15, season: 0.15 }

  // 1. Conditions score (0–3)
  let conditionScore = 2 // default if no weather
  if (weather) {
    const assessment = assessConditions(weather.current, waterLevel)
    conditionScore = CONDITION_SCORES[assessment.level]
    reasons.push(assessment.label)
  }

  // 2. Wind alignment (0–3)
  let windScore = 1.5 // default neutral
  if (!isLoop && weather) {
    let bearing: number | null = null

    if (route.putInLat != null && route.putInLng != null && route.takeOutLat != null && route.takeOutLng != null) {
      bearing = calculateBearing(route.putInLat, route.putInLng, route.takeOutLat, route.takeOutLng)
    } else if (route.geojson) {
      bearing = bearingFromGeojson(route.geojson)
    }

    if (bearing != null) {
      const windFrom = weather.current.windDirection
      // Wind blowing direction = windFrom + 180
      const windBlowing = (windFrom + 180) % 360
      const diff = Math.abs(bearing - windBlowing)
      const angleDiff = Math.min(diff, 360 - diff)

      if (angleDiff < 60) {
        windScore = 3
        reasons.push('Tailwind')
      } else if (angleDiff <= 120) {
        windScore = 1.5
        reasons.push('Crosswind')
      } else {
        windScore = 0
        reasons.push('Headwind')
      }
    }
  }

  // 3. Daylight score (0–3)
  let daylightScore = 2 // default if no data
  if (sunTimes) {
    const dayHours = parseDayLengthHours(sunTimes.dayLength)
    const distKm = route.distanceKm ? Number(route.distanceKm) : 10
    const estimatedHours = distKm / 4 + 1 // 4 km/h average + 1hr buffer
    const ratio = dayHours / estimatedHours

    if (ratio >= 2) {
      daylightScore = 3
      reasons.push('Plenty of daylight')
    } else if (ratio >= 1.3) {
      daylightScore = 2
    } else if (ratio >= 1) {
      daylightScore = 1
      reasons.push('Limited daylight')
    } else {
      daylightScore = 0
      reasons.push('Not enough daylight')
    }
  }

  // 4. Water level score (0–3)
  let waterScore = 2 // default if no data
  if (waterLevel) {
    if (waterLevel.trend === 'stable') {
      waterScore = 3
      reasons.push('Stable water level')
    } else if (waterLevel.trend === 'falling' || (waterLevel.trend === 'rising' && waterLevel.trendDelta <= 50)) {
      waterScore = 2
    } else if (waterLevel.trend === 'rising' && waterLevel.trendDelta > 50) {
      waterScore = 0
      reasons.push('Water rising fast')
    }
  }

  // 5. Season score (0–3)
  const currentMonth = new Date().getMonth()
  const seasonVal = seasonScore(currentMonth, route.bestSeasonNotes)
  if (seasonVal === 3) reasons.push('In season')
  else if (seasonVal === 0) reasons.push('Out of season')

  // Composite: weighted sum normalised to 0–100
  const rawScore =
    weights.conditions * conditionScore +
    weights.wind * windScore +
    weights.daylight * daylightScore +
    weights.water * waterScore +
    weights.season * seasonVal

  const score = Math.round((rawScore / 3) * 100)

  return {
    routeId: route.id,
    routeName: route.name,
    routeType: route.type,
    score,
    reasons: reasons.slice(0, 3), // top 3 reasons
  }
}

export function rankRoutes(inputs: RouteScoreInput[]): RouteScore[] {
  return inputs
    .map(scoreRoute)
    .sort((a, b) => b.score - a.score)
}

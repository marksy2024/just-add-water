/**
 * GPX import/export utilities + Haversine distance calculation
 */

interface GeoJSONLineString {
  type: 'LineString'
  coordinates: [number, number, number?][] // [lng, lat, ele?]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONLineString
  properties: Record<string, unknown>
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

/**
 * Convert GeoJSON to GPX XML string
 */
export function geojsonToGpx(
  geojson: Record<string, unknown>,
  routeName?: string
): string {
  const coords = extractCoordinates(geojson)
  if (coords.length === 0) {
    throw new Error('No coordinates found in GeoJSON')
  }

  const trkpts = coords
    .map(([lng, lat, ele]) => {
      const eleTag = ele != null ? `\n        <ele>${ele}</ele>` : ''
      return `      <trkpt lat="${lat}" lon="${lng}">${eleTag}\n      </trkpt>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Just Add Water"
  xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(routeName || 'Route')}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

/**
 * Parse GPX XML string to GeoJSON + distance
 */
export function gpxToGeojson(gpxString: string): {
  geojson: GeoJSONFeatureCollection
  name: string | null
  distanceKm: number
  putIn: { lat: number; lng: number } | null
  takeOut: { lat: number; lng: number } | null
} {
  const coordinates: [number, number, number?][] = []
  let name: string | null = null

  // Extract track name
  const nameMatch = gpxString.match(/<name>(.*?)<\/name>/)
  if (nameMatch) {
    name = unescapeXml(nameMatch[1])
  }

  // Extract trackpoints
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/gi
  let match: RegExpExecArray | null

  while ((match = trkptRegex.exec(gpxString)) !== null) {
    const lat = parseFloat(match[1])
    const lng = parseFloat(match[2])
    const eleMatch = match[3].match(/<ele>([\d.]+)<\/ele>/)
    const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined

    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates.push(ele != null ? [lng, lat, ele] : [lng, lat])
    }
  }

  // Also try waypoints (<wpt>) if no trackpoints found
  if (coordinates.length === 0) {
    const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/gi
    while ((match = wptRegex.exec(gpxString)) !== null) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      const eleMatch = match[3].match(/<ele>([\d.]+)<\/ele>/)
      const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined

      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push(ele != null ? [lng, lat, ele] : [lng, lat])
      }
    }
  }

  // Also try route points (<rtept>)
  if (coordinates.length === 0) {
    const rteptRegex = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/rtept>/gi
    while ((match = rteptRegex.exec(gpxString)) !== null) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.push([lng, lat])
      }
    }
  }

  const distanceKm = coordinates.length >= 2 ? calculateDistance(coordinates) : 0

  const putIn = coordinates.length > 0
    ? { lat: coordinates[0][1], lng: coordinates[0][0] }
    : null
  const takeOut = coordinates.length > 1
    ? { lat: coordinates[coordinates.length - 1][1], lng: coordinates[coordinates.length - 1][0] }
    : null

  const geojson: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: coordinates.length >= 2
      ? [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: { name },
        }]
      : [],
  }

  return { geojson, name, distanceKm, putIn, takeOut }
}

/**
 * Calculate total distance in km using Haversine formula
 */
export function calculateDistance(coordinates: [number, number, number?][]): number {
  let totalKm = 0
  for (let i = 1; i < coordinates.length; i++) {
    totalKm += haversine(
      coordinates[i - 1][1], coordinates[i - 1][0], // lat, lng
      coordinates[i][1], coordinates[i][0]
    )
  }
  return Math.round(totalKm * 100) / 100
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function extractCoordinates(geojson: Record<string, unknown>): [number, number, number?][] {
  if (geojson.type === 'FeatureCollection') {
    const fc = geojson as unknown as GeoJSONFeatureCollection
    for (const feature of fc.features) {
      if (feature.geometry?.type === 'LineString') {
        return feature.geometry.coordinates
      }
    }
  }
  if (geojson.type === 'Feature') {
    const f = geojson as unknown as GeoJSONFeature
    if (f.geometry?.type === 'LineString') {
      return f.geometry.coordinates
    }
  }
  if (geojson.type === 'LineString') {
    return (geojson as unknown as GeoJSONLineString).coordinates
  }
  return []
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}

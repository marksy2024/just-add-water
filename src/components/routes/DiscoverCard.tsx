'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { TypeBadge, DifficultyBadge } from '@/components/ui/Badge'
import { Ruler, Navigation, ExternalLink, Droplets, CalendarDays } from 'lucide-react'
import type { WaterLevelData } from '@/lib/water-level'
import { trendIcon, trendColor, formatWaterLevel } from '@/lib/water-level'

interface DiscoverRoute {
  id: string
  name: string
  type: string
  difficulty: string
  distanceKm: number | null
  putInLat: number | null
  putInLng: number | null
  putInDescription: string | null
  bestSeasonNotes: string | null
  hubeauStationCode: string | null
}

interface DiscoverCardProps {
  route: DiscoverRoute
  waterLevel?: WaterLevelData | null
}

export function DiscoverCard({ route, waterLevel }: DiscoverCardProps) {
  const router = useRouter()
  const lat = route.putInLat
  const lng = route.putInLng
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null

  return (
    <div onClick={() => router.push(`/routes/${route.id}`)} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/routes/${route.id}`) }}>
      <Card hover className="space-y-2">
        {/* Row 1: Name + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-deep-ocean text-sm leading-tight">{route.name}</h3>
          <TypeBadge type={route.type} size="sm" />
          <DifficultyBadge difficulty={route.difficulty} />
        </div>

        {/* Row 2: Distance + Put-in */}
        <div className="flex items-center gap-4 text-xs text-driftwood">
          {route.distanceKm && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              {route.distanceKm} km
            </span>
          )}
          {route.putInDescription && (
            <span className="flex items-center gap-1 min-w-0">
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{route.putInDescription}</span>
            </span>
          )}
        </div>

        {/* Row 3: Google Maps link + Water level + Season */}
        <div className="flex items-center gap-4 text-xs">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-atlantic-blue hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Map
            </a>
          )}

          {route.hubeauStationCode && (
            <span className="flex items-center gap-1.5">
              {waterLevel ? (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      waterLevel.trend === 'rising'
                        ? 'bg-amber-buoy'
                        : waterLevel.trend === 'falling'
                          ? 'bg-atlantic-blue'
                          : 'bg-kelp-green'
                    }`}
                  />
                  <span className={`font-medium ${trendColor(waterLevel.trend)}`}>
                    {formatWaterLevel(waterLevel.level)} {trendIcon(waterLevel.trend)}
                  </span>
                </>
              ) : (
                <>
                  <Droplets className="w-3 h-3 text-storm-grey/40" />
                  <span className="text-storm-grey/40">No data</span>
                </>
              )}
            </span>
          )}

          {route.bestSeasonNotes && (
            <span className="flex items-center gap-1 text-driftwood ml-auto">
              <CalendarDays className="w-3 h-3" />
              {route.bestSeasonNotes}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import { DiscoverCard } from '@/components/routes/DiscoverCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Heart } from 'lucide-react'
import type { WaterLevelData } from '@/lib/water-level'

interface SerializedRoute {
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
  department: string | null
  paddleCount: number
  creatorName: string | null
  isFavourite: boolean
}

interface RouteFiltersProps {
  routes: SerializedRoute[]
  waterLevels: Record<string, WaterLevelData>
}

const TYPE_FILTERS = ['All', 'River', 'Canal', 'Lake'] as const
const DEPARTMENTS = [
  'All',
  'Vendée',
  'Deux-Sèvres',
  'Loire-Atlantique',
  'Maine-et-Loire',
  'Vienne',
  'Charente',
  'Charente-Maritime',
] as const

export function RouteFilters({ routes, waterLevels }: RouteFiltersProps) {
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [deptFilter, setDeptFilter] = useState<string>('All')
  const [showFavourites, setShowFavourites] = useState(false)
  const [favourites, setFavourites] = useState<Set<string>>(
    () => new Set(routes.filter((r) => r.isFavourite).map((r) => r.id))
  )

  const toggleFavourite = useCallback(async (routeId: string) => {
    // Optimistic update
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(routeId)) next.delete(routeId)
      else next.add(routeId)
      return next
    })
    try {
      await fetch(`/api/routes/${routeId}/favourite`, { method: 'POST' })
    } catch {
      // Revert on error
      setFavourites((prev) => {
        const next = new Set(prev)
        if (next.has(routeId)) next.delete(routeId)
        else next.add(routeId)
        return next
      })
    }
  }, [])

  const filtered = useMemo(() => {
    return routes.filter((route) => {
      if (showFavourites && !favourites.has(route.id)) return false
      if (typeFilter !== 'All' && route.type !== typeFilter.toLowerCase()) return false
      if (deptFilter !== 'All' && route.department !== deptFilter) return false
      return true
    })
  }, [routes, typeFilter, deptFilter, showFavourites, favourites])

  return (
    <>
      {/* Favourites toggle + Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setShowFavourites(!showFavourites)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
            showFavourites
              ? 'bg-sunset-coral text-white'
              : 'bg-storm-grey/10 text-storm-grey hover:bg-storm-grey/20'
          }`}
        >
          <Heart className={`w-3 h-3 ${showFavourites ? 'fill-current' : ''}`} />
          Favourites
        </button>
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === type
                ? 'bg-deep-ocean text-white'
                : 'bg-storm-grey/10 text-storm-grey hover:bg-storm-grey/20'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Department filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setDeptFilter(dept)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              deptFilter === dept
                ? 'bg-atlantic-blue text-white'
                : 'bg-shallows/20 text-atlantic-blue hover:bg-shallows/30'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-driftwood">{filtered.length} route{filtered.length !== 1 ? 's' : ''}</p>

      {/* Route cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            title="No routes found"
            description="Try changing your filters to see more routes."
          />
        ) : (
          filtered.map((route) => (
            <DiscoverCard
              key={route.id}
              route={route}
              waterLevel={
                route.hubeauStationCode
                  ? waterLevels[route.hubeauStationCode] ?? null
                  : null
              }
              paddleCount={route.paddleCount}
              creatorName={route.creatorName}
              isFavourite={favourites.has(route.id)}
              onToggleFavourite={toggleFavourite}
            />
          ))
        )}
      </div>
    </>
  )
}

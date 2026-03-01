'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { DiscoverCard } from '@/components/routes/DiscoverCard'
import { EmptyState } from '@/components/ui/EmptyState'
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
}

interface DiscoverFiltersProps {
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

export function DiscoverFilters({ routes, waterLevels }: DiscoverFiltersProps) {
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [deptFilter, setDeptFilter] = useState<string>('All')

  const filtered = useMemo(() => {
    return routes.filter((route) => {
      if (typeFilter !== 'All' && route.type !== typeFilter.toLowerCase()) return false
      if (deptFilter !== 'All' && route.department !== deptFilter) return false
      return true
    })
  }, [routes, typeFilter, deptFilter])

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-atlantic-blue" />
        <h2 className="text-lg font-bold text-deep-ocean">Discover</h2>
        <span className="text-xs text-driftwood ml-auto">{filtered.length} routes</span>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
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
            />
          ))
        )}
      </div>
    </>
  )
}

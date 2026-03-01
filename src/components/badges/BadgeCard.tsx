'use client'

import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import {
  Lock,
  Award,
  Milestone,
  Flame,
  Map,
  Trophy,
  Waves,
  Compass,
  Star,
  type LucideIcon,
} from 'lucide-react'

interface BadgeDefinition {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  category: 'distance' | 'count' | 'streak' | 'variety' | 'challenge'
}

interface BadgeCardProps {
  badge: BadgeDefinition
  earned: boolean
  earnedAt?: string | null
  isNew?: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  award: Award,
  milestone: Milestone,
  flame: Flame,
  map: Map,
  trophy: Trophy,
  waves: Waves,
  compass: Compass,
  star: Star,
}

const CATEGORY_COLORS: Record<string, string> = {
  distance: 'text-atlantic-blue',
  count: 'text-kelp-green',
  streak: 'text-sunset-coral',
  variety: 'text-deep-ocean',
  challenge: 'text-sunset-coral',
}

function getBadgeIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName.toLowerCase()] || Award
}

export function BadgeCard({ badge, earned, earnedAt, isNew = false }: BadgeCardProps) {
  const IconComponent = getBadgeIcon(badge.icon)
  const colorClass = CATEGORY_COLORS[badge.category] || 'text-atlantic-blue'

  if (!earned) {
    return (
      <Card padding="sm" className="opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-storm-grey/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-storm-grey/40" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-storm-grey truncate">
              {badge.name}
            </h4>
            <p className="text-xs text-driftwood/60 truncate">
              {badge.description}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      padding="sm"
      className={isNew ? 'badge-earned ring-2 ring-sunset-coral/30' : ''}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            badge.category === 'streak'
              ? 'bg-sunset-coral/10'
              : badge.category === 'distance'
                ? 'bg-atlantic-blue/10'
                : badge.category === 'count'
                  ? 'bg-kelp-green/10'
                  : 'bg-deep-ocean/10'
          }`}
        >
          <IconComponent className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-deep-ocean truncate">
              {badge.name}
            </h4>
            {isNew && (
              <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-sunset-coral bg-sunset-coral/10 px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
          <p className="text-xs text-driftwood truncate">
            {badge.description}
          </p>
          {earnedAt && (
            <p className="text-[10px] text-driftwood/50 mt-0.5">
              Earned {formatDate(earnedAt)}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'

interface FoodSectionProps {
  paddleId: string
  isOrganiser: boolean
  participants: { userId: string; userName: string; userImage: string | null }[]
  initialAllocations: { id: string; userId: string; category: string }[]
}

const CATEGORIES = [
  { key: 'bread', emoji: '\u{1F35E}', label: 'Bread' },
  { key: 'main', emoji: '\u{1F372}', label: 'Main' },
  { key: 'dessert', emoji: '\u{1F370}', label: 'Dessert' },
  { key: 'snacks', emoji: '\u{1F34E}', label: 'Snacks' },
  { key: 'drinks', emoji: '\u{1F964}', label: 'Drinks' },
] as const

export function FoodSection({
  paddleId,
  isOrganiser,
  participants,
  initialAllocations,
}: FoodSectionProps) {
  const [allocations, setAllocations] = useState(initialAllocations)
  const [loading, setLoading] = useState<string | null>(null) // "userId:category"

  const hasAllocation = useCallback(
    (userId: string, category: string) =>
      allocations.some((a) => a.userId === userId && a.category === category),
    [allocations]
  )

  const toggleAllocation = useCallback(
    async (userId: string, category: string) => {
      const key = `${userId}:${category}`
      if (loading) return
      setLoading(key)

      try {
        const res = await fetch(`/api/paddles/${paddleId}/food`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, category }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.action === 'added') {
            setAllocations((prev) => [
              ...prev,
              { id: crypto.randomUUID(), userId, category },
            ])
          } else {
            setAllocations((prev) =>
              prev.filter((a) => !(a.userId === userId && a.category === category))
            )
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(null)
      }
    },
    [paddleId, loading]
  )

  // Non-organiser: only show participants who have assignments
  const visibleParticipants = isOrganiser
    ? participants
    : participants.filter((p) =>
        allocations.some((a) => a.userId === p.userId)
      )

  if (!isOrganiser && visibleParticipants.length === 0) return null

  return (
    <Card>
      <div className="space-y-3">
        {visibleParticipants.map((p) => (
          <div key={p.userId}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-sea-foam flex items-center justify-center overflow-hidden shrink-0">
                {p.userImage ? (
                  <img
                    src={p.userImage}
                    alt={p.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-atlantic-blue">
                    {(p.userName || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-deep-ocean">
                {p.userName}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pl-9">
              {CATEGORIES.map((cat) => {
                const active = hasAllocation(p.userId, cat.key)
                const isLoading = loading === `${p.userId}:${cat.key}`

                if (!isOrganiser && !active) return null

                return (
                  <button
                    key={cat.key}
                    type="button"
                    disabled={!isOrganiser || isLoading}
                    onClick={() => isOrganiser && toggleAllocation(p.userId, cat.key)}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? 'bg-kelp-green/10 text-kelp-green border-kelp-green/30'
                        : 'bg-storm-grey/5 text-driftwood border-storm-grey/15'
                    } ${isOrganiser ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} ${
                      isLoading ? 'opacity-50' : ''
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

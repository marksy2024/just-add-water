'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Check, HelpCircle, X } from 'lucide-react'

interface RSVPButtonsProps {
  paddleId: string
  currentRsvp: string | null
}

const rsvpOptions = [
  {
    value: 'going',
    label: 'Going',
    icon: Check,
    activeStyle: 'bg-kelp-green text-white hover:bg-kelp-green/90',
    inactiveStyle: 'border-2 border-kelp-green/30 text-kelp-green hover:bg-kelp-green/5',
  },
  {
    value: 'maybe',
    label: 'Maybe',
    icon: HelpCircle,
    activeStyle: 'bg-amber-buoy text-white hover:bg-amber-buoy/90',
    inactiveStyle: 'border-2 border-amber-buoy/30 text-amber-buoy hover:bg-amber-buoy/5',
  },
  {
    value: 'not_going',
    label: 'Not going',
    icon: X,
    activeStyle: 'bg-storm-grey text-white hover:bg-storm-grey/90',
    inactiveStyle: 'border-2 border-storm-grey/30 text-storm-grey hover:bg-storm-grey/5',
  },
] as const

export function RSVPButtons({ paddleId, currentRsvp }: RSVPButtonsProps) {
  const [rsvp, setRsvp] = useState<string | null>(currentRsvp)
  const [loading, setLoading] = useState<string | null>(null)

  const handleRsvp = async (value: string) => {
    if (loading) return
    setLoading(value)

    try {
      const res = await fetch(`/api/paddles/${paddleId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvp: value }),
      })

      if (res.ok) {
        setRsvp(value)
      }
    } catch (err) {
      console.error('RSVP failed:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <p className="text-sm font-semibold text-deep-ocean mb-3">Are you joining?</p>
      <div className="grid grid-cols-3 gap-2">
        {rsvpOptions.map((option) => {
          const Icon = option.icon
          const isActive = rsvp === option.value
          const isLoading = loading === option.value

          return (
            <button
              key={option.value}
              onClick={() => handleRsvp(option.value)}
              disabled={loading !== null}
              className={`
                inline-flex flex-col items-center justify-center gap-1 py-3 px-2
                rounded-xl font-semibold text-sm transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
                ${isActive ? option.activeStyle : option.inactiveStyle}
              `}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              {option.label}
            </button>
          )
        })}
      </div>
      {rsvp && (
        <p className="text-xs text-driftwood text-center mt-3">
          {rsvp === 'going' && 'You\u2019re in! See you on the water.'}
          {rsvp === 'maybe' && 'No worries \u2014 you can update anytime.'}
          {rsvp === 'not_going' && 'Maybe next time! You can change your mind later.'}
        </p>
      )}
    </Card>
  )
}

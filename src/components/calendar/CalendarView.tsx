'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Users, MapPin, X, Plus } from 'lucide-react'
import Link from 'next/link'

interface CalendarPaddle {
  id: string
  title: string
  date: string
  status: 'planned' | 'active' | 'completed'
  distance_km: number | null
  route_name: string | null
  route_type: 'river' | 'lake' | 'coastal' | 'canal' | null
  participant_count: number
}

interface CalendarViewProps {
  initialPaddles: CalendarPaddle[]
  initialYear: number
  initialMonth: number // 1-indexed
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TYPE_COLORS: Record<string, string> = {
  river: '#0C4A6E',
  lake: '#0284C7',
  coastal: '#38BDF8',
  canal: '#059669',
}

const TYPE_LABELS: Record<string, string> = {
  river: 'River',
  lake: 'Lake',
  coastal: 'Coastal',
  canal: 'Canal',
}

function getMonthName(month: number): string {
  return new Date(2024, month - 1).toLocaleDateString('en-GB', { month: 'long' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Monday=0 offset for the first day of the month
function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1 // Convert Sunday=0 to Monday-based
}

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 5 || dayOfWeek === 6 // Saturday or Sunday in 0-indexed Mon-based
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day
}

export function CalendarView({ initialPaddles, initialYear, initialMonth }: CalendarViewProps) {
  const [paddles, setPaddles] = useState<CalendarPaddle[]>(initialPaddles)
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchMonth = useCallback(async (newYear: number, newMonth: number) => {
    setLoading(true)
    setSelectedDay(null)
    try {
      const res = await fetch(`/api/calendar?year=${newYear}&month=${newMonth}`)
      if (res.ok) {
        const data = await res.json()
        setPaddles(data.paddles)
      }
    } catch {
      // Silently fail — keep old data
    } finally {
      setLoading(false)
    }
  }, [])

  const goToPrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    setMonth(newMonth)
    setYear(newYear)
    fetchMonth(newYear, newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    setMonth(newMonth)
    setYear(newYear)
    fetchMonth(newYear, newMonth)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOffset(year, month)

  // Group paddles by day
  const paddlesByDay: Record<number, CalendarPaddle[]> = {}
  for (const paddle of paddles) {
    const day = new Date(paddle.date).getDate()
    if (!paddlesByDay[day]) paddlesByDay[day] = []
    paddlesByDay[day].push(paddle)
  }

  // Selected day paddles
  const selectedPaddles = selectedDay ? paddlesByDay[selectedDay] || [] : []
  const selectedDayOfWeek = selectedDay
    ? (new Date(year, month - 1, selectedDay).getDay() === 0
        ? 6
        : new Date(year, month - 1, selectedDay).getDay() - 1)
    : 0

  return (
    <div className="space-y-4">
      {/* Month/Year Header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            disabled={loading}
            className="p-2 rounded-xl text-storm-grey hover:bg-sand transition-colors disabled:opacity-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-deep-ocean">
            {getMonthName(month)} {year}
          </h2>
          <button
            onClick={goToNextMonth}
            disabled={loading}
            className="p-2 rounded-xl text-storm-grey hover:bg-sand transition-colors disabled:opacity-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card padding="sm">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-semibold text-driftwood uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={`grid grid-cols-7 gap-0.5 ${loading ? 'opacity-50' : ''}`}>
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Actual day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPaddles = paddlesByDay[day] || []
            const today = isToday(year, month, day)
            const isSelected = selectedDay === day
            const dayIndex = (firstDayOffset + i) % 7

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl
                  transition-all duration-150 relative
                  ${today ? 'ring-2 ring-atlantic-blue ring-offset-1' : ''}
                  ${isSelected ? 'bg-deep-ocean text-white' : 'hover:bg-sand'}
                  ${isWeekend(dayIndex) && !isSelected ? 'bg-sea-foam/30' : ''}
                `}
              >
                <span
                  className={`text-sm font-semibold ${
                    isSelected
                      ? 'text-white'
                      : today
                        ? 'text-atlantic-blue'
                        : 'text-deep-ocean'
                  }`}
                >
                  {day}
                </span>

                {/* Paddle dots */}
                {dayPaddles.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {dayPaddles.slice(0, 3).map((paddle, pi) => (
                      <div
                        key={pi}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? '#FFFFFF'
                            : TYPE_COLORS[paddle.route_type || ''] || '#475569',
                        }}
                      />
                    ))}
                    {dayPaddles.length > 3 && (
                      <span
                        className={`text-[8px] font-bold ${
                          isSelected ? 'text-white/80' : 'text-driftwood'
                        }`}
                      >
                        +{dayPaddles.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TYPE_COLORS[type] }}
            />
            <span className="text-[11px] text-driftwood font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected Day Panel */}
      {selectedDay !== null && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up">
          <div className="bg-salt-white rounded-t-2xl shadow-[0_-4px_24px_rgba(12,74,110,0.12)] max-w-2xl mx-auto">
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-storm-grey/20" />
            </div>

            <div className="px-4 pb-6 max-h-[50vh] overflow-y-auto">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-deep-ocean">
                  {new Date(year, month - 1, selectedDay).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg text-driftwood hover:bg-sand transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedPaddles.length > 0 ? (
                <div className="space-y-2">
                  {selectedPaddles.map((paddle) => (
                    <Link key={paddle.id} href={`/paddles/${paddle.id}`}>
                      <div className="p-3 rounded-xl bg-sand hover:bg-sea-foam/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-deep-ocean truncate">
                              {paddle.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {paddle.route_name && (
                                <span className="flex items-center gap-1 text-xs text-driftwood">
                                  <MapPin className="w-3 h-3" />
                                  {paddle.route_name}
                                </span>
                              )}
                              {paddle.route_type && (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: TYPE_COLORS[paddle.route_type],
                                    }}
                                  />
                                  <span className="text-[10px] text-driftwood capitalize">
                                    {paddle.route_type}
                                  </span>
                                </div>
                              )}
                              {paddle.participant_count > 0 && (
                                <span className="flex items-center gap-1 text-xs text-driftwood">
                                  <Users className="w-3 h-3" />
                                  {paddle.participant_count}
                                </span>
                              )}
                              {paddle.distance_km && (
                                <span className="text-xs font-semibold text-atlantic-blue">
                                  {paddle.distance_km.toFixed(1)}km
                                </span>
                              )}
                            </div>
                          </div>
                          <StatusBadge status={paddle.status} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : isWeekend(selectedDayOfWeek) ? (
                <div className="text-center py-6">
                  <p className="text-sm text-driftwood mb-3">
                    No paddle planned — fancy organising one?
                  </p>
                  <Link href="/paddles/plan">
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                      Plan a Paddle
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-driftwood">No paddles on this day</p>
                </div>
              )}
            </div>

            {/* Safe area padding for mobile */}
            <div className="pb-safe" />
          </div>
        </div>
      )}

      {/* Slide-up animation style */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.33, 1, 0.68, 1);
        }
      `}</style>
    </div>
  )
}

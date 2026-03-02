'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { ChevronLeft, ChevronRight, Users, MapPin, X, Plus } from 'lucide-react'
import Link from 'next/link'

interface CalendarPaddle {
  id: string
  title: string
  date: string
  end_date: string | null
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

function getFirstDayOffset(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function isWeekend(col: number): boolean {
  return col === 5 || col === 6
}

function isToday(year: number, month: number, day: number): boolean {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day
}

/* ── Date helpers (timezone-safe) ────────────────────────────────────────── */

function parseLocalDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.slice(0, 10).split('-')
  return { year: +parts[0], month: +parts[1], day: +parts[2] }
}

function dateVal(y: number, m: number, d: number) {
  return y * 10000 + m * 100 + d
}

/** Get the day range a paddle covers within this month (clamped). */
function getEffectiveRange(
  paddle: CalendarPaddle,
  year: number,
  month: number,
  daysInMonth: number,
): { startDay: number; endDay: number } | null {
  const s = parseLocalDate(paddle.date)
  const e = paddle.end_date ? parseLocalDate(paddle.end_date) : s

  const sVal = dateVal(s.year, s.month, s.day)
  const eVal = dateVal(e.year, e.month, e.day)
  const mStart = dateVal(year, month, 1)
  const mEnd = dateVal(year, month, daysInMonth)

  if (eVal < mStart || sVal > mEnd) return null

  const startDay = sVal < mStart ? 1 : s.year === year && s.month === month ? s.day : 1
  const endDay = eVal > mEnd ? daysInMonth : e.year === year && e.month === month ? e.day : daysInMonth

  return { startDay, endDay }
}

/* ── Event bar layout engine ─────────────────────────────────────────────── */

interface EventSegment {
  paddle: CalendarPaddle
  startCol: number // 1-7
  span: number
  isStart: boolean // left rounded
  isEnd: boolean   // right rounded
}

function getWeekSegments(
  paddles: CalendarPaddle[],
  weekRow: number,
  firstDayOffset: number,
  year: number,
  month: number,
  daysInMonth: number,
): EventSegment[] {
  const segments: EventSegment[] = []

  for (const paddle of paddles) {
    const range = getEffectiveRange(paddle, year, month, daysInMonth)
    if (!range) continue

    const startCell = firstDayOffset + range.startDay - 1
    const endCell = firstDayOffset + range.endDay - 1
    const startWeek = Math.floor(startCell / 7)
    const endWeek = Math.floor(endCell / 7)

    if (weekRow < startWeek || weekRow > endWeek) continue

    const wStart = weekRow * 7
    const wEnd = weekRow * 7 + 6
    const segStart = Math.max(startCell, wStart)
    const segEnd = Math.min(endCell, wEnd)

    segments.push({
      paddle,
      startCol: (segStart % 7) + 1,
      span: segEnd - segStart + 1,
      isStart: segStart === startCell,
      isEnd: segEnd === endCell,
    })
  }

  segments.sort((a, b) => a.startCol - b.startCol || b.span - a.span)
  return segments
}

function assignLanes(segments: EventSegment[]): { segment: EventSegment; lane: number }[] {
  const laneEnds: number[] = []
  const result: { segment: EventSegment; lane: number }[] = []

  for (const seg of segments) {
    let lane = -1
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] < seg.startCol) {
        lane = i
        break
      }
    }
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = seg.startCol + seg.span - 1
    result.push({ segment: seg, lane })
  }

  return result
}

const MAX_VISIBLE_LANES = 2

/* ── Component ───────────────────────────────────────────────────────────── */

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
      // keep old data
    } finally {
      setLoading(false)
    }
  }, [])

  const goToPrevMonth = () => {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setMonth(m)
    setYear(y)
    fetchMonth(y, m)
  }

  const goToNextMonth = () => {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setMonth(m)
    setYear(y)
    fetchMonth(y, m)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOffset(year, month)
  const numWeeks = Math.ceil((firstDayOffset + daysInMonth) / 7)

  // Map each day → paddles (for the bottom detail panel)
  const paddlesByDay = useMemo(() => {
    const map: Record<number, CalendarPaddle[]> = {}
    for (const p of paddles) {
      const range = getEffectiveRange(p, year, month, daysInMonth)
      if (!range) continue
      for (let d = range.startDay; d <= range.endDay; d++) {
        if (!map[d]) map[d] = []
        map[d].push(p)
      }
    }
    return map
  }, [paddles, year, month, daysInMonth])

  const selectedPaddles = selectedDay ? paddlesByDay[selectedDay] || [] : []
  const selectedDayCol = selectedDay ? (firstDayOffset + selectedDay - 1) % 7 : 0

  return (
    <div className="space-y-4">
      {/* Month / Year header */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <button onClick={goToPrevMonth} disabled={loading} className="p-2 rounded-xl text-storm-grey hover:bg-sand transition-colors disabled:opacity-50" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-deep-ocean">
            {getMonthName(month)} {year}
          </h2>
          <button onClick={goToNextMonth} disabled={loading} className="p-2 rounded-xl text-storm-grey hover:bg-sand transition-colors disabled:opacity-50" aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Calendar grid */}
      <Card padding="sm">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-driftwood uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
        </div>

        <div className={loading ? 'opacity-50' : ''}>
          {Array.from({ length: numWeeks }).map((_, weekIdx) => {
            const weekStartCell = weekIdx * 7
            const segments = getWeekSegments(paddles, weekIdx, firstDayOffset, year, month, daysInMonth)
            const lanedSegments = assignLanes(segments)
            const maxLane = lanedSegments.length > 0 ? Math.max(...lanedSegments.map((l) => l.lane)) : -1
            const visibleLaneCount = Math.min(maxLane + 1, MAX_VISIBLE_LANES)
            const hiddenCount = lanedSegments.filter((l) => l.lane >= MAX_VISIBLE_LANES).length

            return (
              <div key={weekIdx} className="mb-1">
                {/* Day numbers */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: 7 }).map((_, col) => {
                    const cellIdx = weekStartCell + col
                    const day = cellIdx - firstDayOffset + 1

                    if (cellIdx < firstDayOffset || day > daysInMonth) {
                      return <div key={col} className="h-7" />
                    }

                    const today = isToday(year, month, day)
                    const selected = selectedDay === day
                    const weekend = isWeekend(col)

                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedDay(selected ? null : day)}
                        className={[
                          'h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-all',
                          today && !selected ? 'ring-1 ring-atlantic-blue ring-offset-1' : '',
                          selected ? 'bg-deep-ocean text-white' : 'hover:bg-sand',
                          weekend && !selected ? 'bg-sea-foam/30' : '',
                          !selected ? (today ? 'text-atlantic-blue' : 'text-deep-ocean') : '',
                        ].join(' ')}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                {/* Event bar lanes */}
                {Array.from({ length: visibleLaneCount }).map((_, laneIdx) => {
                  const laneEvents = lanedSegments.filter((l) => l.lane === laneIdx)
                  if (laneEvents.length === 0) return null

                  return (
                    <div key={laneIdx} className="grid grid-cols-7 mt-0.5">
                      {laneEvents.map(({ segment }) => (
                        <button
                          key={segment.paddle.id}
                          onClick={() => {
                            const range = getEffectiveRange(segment.paddle, year, month, daysInMonth)
                            if (range) setSelectedDay(range.startDay)
                          }}
                          style={{
                            gridColumn: `${segment.startCol} / span ${segment.span}`,
                            backgroundColor: TYPE_COLORS[segment.paddle.route_type || ''] || '#475569',
                          }}
                          className={[
                            'h-[18px] px-1 text-[9px] font-medium text-white truncate text-left leading-[18px]',
                            segment.isStart && segment.isEnd ? 'rounded-md' : '',
                            segment.isStart && !segment.isEnd ? 'rounded-l-md' : '',
                            !segment.isStart && segment.isEnd ? 'rounded-r-md' : '',
                            !segment.isStart && !segment.isEnd ? '' : '',
                          ].join(' ')}
                          title={segment.paddle.title}
                        >
                          {segment.isStart ? segment.paddle.title : ''}
                        </button>
                      ))}
                    </div>
                  )
                })}

                {hiddenCount > 0 && (
                  <p className="text-[9px] text-driftwood text-center mt-0.5">
                    +{hiddenCount} more
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
            <span className="text-[11px] text-driftwood font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected-day bottom panel */}
      {selectedDay !== null && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
          <div className="bg-salt-white rounded-t-2xl shadow-[0_-4px_24px_rgba(12,74,110,0.12)] max-w-2xl mx-auto">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-storm-grey/20" />
            </div>

            <div className="px-4 pb-6 min-h-[30vh] max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-deep-ocean">
                  {new Date(year, month - 1, selectedDay).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg text-driftwood hover:bg-sand transition-colors" aria-label="Close">
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
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[paddle.route_type] }} />
                                  <span className="text-[10px] text-driftwood capitalize">{paddle.route_type}</span>
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
                                  {Number(paddle.distance_km).toFixed(1)}km
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
              ) : isWeekend(selectedDayCol) ? (
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

            <div className="pb-safe" />
          </div>
        </div>
      )}

      {/* Slide-up animation */}
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

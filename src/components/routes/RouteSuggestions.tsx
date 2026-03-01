import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { TypeBadge } from '@/components/ui/Badge'
import { ThumbsUp } from 'lucide-react'
import type { RouteScore } from '@/lib/route-scoring'

interface RouteSuggestionsProps {
  scores: RouteScore[]
}

function accentClass(score: number): string {
  if (score > 70) return 'border-l-4 border-l-kelp-green'
  if (score >= 40) return 'border-l-4 border-l-amber-buoy'
  return 'border-l-4 border-l-red-flag'
}

function barColor(score: number): string {
  if (score > 70) return 'bg-kelp-green'
  if (score >= 40) return 'bg-amber-buoy'
  return 'bg-red-flag'
}

export function RouteSuggestions({ scores }: RouteSuggestionsProps) {
  if (scores.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <ThumbsUp className="w-4 h-4 text-kelp-green" />
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
          Suggested Paddles
        </h2>
      </div>

      <div className="space-y-2">
        {scores.map((s) => (
          <Link key={s.routeId} href={`/routes/${s.routeId}`}>
            <Card hover className={accentClass(s.score)}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-deep-ocean truncate">{s.routeName}</p>
                    <TypeBadge type={s.routeType} size="sm" />
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 bg-storm-grey/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(s.score)}`}
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-driftwood tabular-nums w-8 text-right">
                      {s.score}%
                    </span>
                  </div>

                  {/* Reasons */}
                  {s.reasons.length > 0 && (
                    <p className="text-[11px] text-driftwood leading-snug">
                      {s.reasons.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

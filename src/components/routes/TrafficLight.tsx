import type { ConditionAssessment } from '@/lib/conditions'

interface TrafficLightProps {
  assessment: ConditionAssessment
}

const dotStyles = {
  green: {
    active: 'bg-kelp-green shadow-[0_0_8px_rgba(5,150,105,0.4)]',
    inactive: 'bg-kelp-green/20',
  },
  amber: {
    active: 'bg-amber-buoy shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    inactive: 'bg-amber-buoy/20',
  },
  red: {
    active: 'bg-red-flag shadow-[0_0_8px_rgba(220,38,38,0.4)]',
    inactive: 'bg-red-flag/20',
  },
}

const labelColors = {
  green: 'text-kelp-green',
  amber: 'text-amber-buoy',
  red: 'text-red-flag',
}

export function TrafficLight({ assessment }: TrafficLightProps) {
  const { level, label, reasons } = assessment

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Dots */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-4 h-4 rounded-full transition-all ${
            level === 'red' ? dotStyles.red.active : dotStyles.red.inactive
          }`}
        />
        <div
          className={`w-4 h-4 rounded-full transition-all ${
            level === 'amber' ? dotStyles.amber.active : dotStyles.amber.inactive
          }`}
        />
        <div
          className={`w-4 h-4 rounded-full transition-all ${
            level === 'green' ? dotStyles.green.active : dotStyles.green.inactive
          }`}
        />
      </div>

      {/* Label + reasons */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${labelColors[level]}`}>
          {label}
        </p>
        {reasons.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {reasons.map((reason, i) => (
              <li key={i} className="text-xs text-driftwood">
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

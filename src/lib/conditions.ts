import type { WeatherData } from '@/lib/weather'
import type { WaterLevelData } from '@/lib/water-level'

export type ConditionLevel = 'green' | 'amber' | 'red'

export interface ConditionAssessment {
  level: ConditionLevel
  label: string
  reasons: string[]
}

// Weather codes indicating rain
const RAIN_CODES = new Set([61, 63, 65, 80, 81, 82, 95, 96])
const HEAVY_RAIN_CODES = new Set([65, 82, 95, 96])

export function assessConditions(
  weather: WeatherData | null,
  waterLevel: WaterLevelData | null
): ConditionAssessment {
  const reasons: string[] = []

  if (!weather) {
    return { level: 'green', label: 'No data', reasons: ['Weather data unavailable'] }
  }

  // Use a numeric score: 0 = green, 1 = amber, 2 = red
  let severity = 0

  // Wind assessment
  if (weather.windSpeed > 40 || weather.windGusts > 55) {
    severity = 2
    reasons.push(`Strong wind: ${Math.round(weather.windSpeed)} km/h (gusts ${Math.round(weather.windGusts)})`)
  } else if (weather.windSpeed > 25 || weather.windGusts > 40) {
    severity = Math.max(severity, 1)
    reasons.push(`Moderate wind: ${Math.round(weather.windSpeed)} km/h (gusts ${Math.round(weather.windGusts)})`)
  } else {
    reasons.push(`Light wind: ${Math.round(weather.windSpeed)} km/h`)
  }

  // Rain assessment
  if (HEAVY_RAIN_CODES.has(weather.weatherCode)) {
    severity = 2
    reasons.push('Heavy rain or thunderstorms')
  } else if (RAIN_CODES.has(weather.weatherCode)) {
    severity = Math.max(severity, 1)
    reasons.push('Rain expected')
  }

  // Temperature assessment
  if (weather.temperature < 3) {
    severity = Math.max(severity, 1)
    reasons.push(`Cold: ${Math.round(weather.temperature)}°C — risk of hypothermia`)
  }

  // Water level assessment
  if (waterLevel) {
    if (waterLevel.trend === 'rising' && waterLevel.trendDelta > 100) {
      severity = 2
      reasons.push(`Water level rising fast (+${waterLevel.trendDelta}mm in 24h)`)
    } else if (waterLevel.trend === 'rising' && waterLevel.trendDelta > 50) {
      severity = Math.max(severity, 1)
      reasons.push(`Water level rising (+${waterLevel.trendDelta}mm in 24h)`)
    } else if (waterLevel.trend === 'falling') {
      reasons.push('Water level falling — may be low')
    } else {
      reasons.push('Water level stable')
    }
  }

  const level: ConditionLevel = severity >= 2 ? 'red' : severity >= 1 ? 'amber' : 'green'

  const labels: Record<ConditionLevel, string> = {
    green: 'Good to paddle',
    amber: 'Paddle with caution',
    red: 'Not recommended',
  }

  return { level, label: labels[level], reasons }
}

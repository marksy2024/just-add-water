'use client'

import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Loading'
import { getWeather, weatherCodeToIcon, weatherCodeToLabel, windDirectionLabel } from '@/lib/weather'
import type { WeatherForecast } from '@/lib/weather'
import { getWaterLevel, trendIcon, trendColor, formatWaterLevel } from '@/lib/water-level'
import type { WaterLevelData } from '@/lib/water-level'
import { getSunTimes, formatTime } from '@/lib/sun'
import type { SunTimes } from '@/lib/sun'
import { assessConditions } from '@/lib/conditions'
import { TrafficLight } from '@/components/routes/TrafficLight'
import { Thermometer, Wind, Droplets, ArrowUp, Sunrise, Sunset } from 'lucide-react'

interface ConditionsCardProps {
  lat: number
  lng: number
  hubeauStationCode?: string | null
}

export function ConditionsCard({ lat, lng, hubeauStationCode }: ConditionsCardProps) {
  const [weather, setWeather] = useState<WeatherForecast | null>(null)
  const [waterLevel, setWaterLevel] = useState<WaterLevelData | null>(null)
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConditions() {
      setLoading(true)
      setError(null)

      try {
        const promises: Promise<unknown>[] = [
          getWeather(lat, lng),
          getSunTimes(lat, lng),
        ]

        if (hubeauStationCode) {
          promises.push(getWaterLevel(hubeauStationCode))
        }

        const results = await Promise.allSettled(promises)

        if (results[0].status === 'fulfilled') {
          setWeather(results[0].value as WeatherForecast)
        }

        if (results[1].status === 'fulfilled') {
          setSunTimes(results[1].value as SunTimes)
        }

        if (hubeauStationCode && results[2]?.status === 'fulfilled') {
          setWaterLevel(results[2].value as WaterLevelData | null)
        }

        // If all fetches failed, show an error
        if (results.every((r) => r.status === 'rejected')) {
          setError('Unable to load conditions right now')
        }
      } catch {
        setError('Unable to load conditions right now')
      } finally {
        setLoading(false)
      }
    }

    fetchConditions()
  }, [lat, lng, hubeauStationCode])

  if (loading) {
    return (
      <Card>
        <CardTitle className="mb-4">Current Conditions</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    )
  }

  if (error && !weather && !waterLevel && !sunTimes) {
    return (
      <Card>
        <CardTitle className="mb-2">Current Conditions</CardTitle>
        <p className="text-sm text-driftwood">{error}</p>
      </Card>
    )
  }

  const conditionAssessment = weather
    ? assessConditions(weather.current, waterLevel)
    : null

  return (
    <Card>
      <CardTitle className="mb-4">Current Conditions</CardTitle>
      {conditionAssessment && <TrafficLight assessment={conditionAssessment} />}
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        {weather && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sand">
            <span className="text-2xl">
              {weatherCodeToIcon(weather.current.weatherCode, weather.current.isDay)}
            </span>
            <div>
              <p className="text-xs text-driftwood">Temperature</p>
              <p className="stat-number text-lg">{Math.round(weather.current.temperature)}°C</p>
              <p className="text-[10px] text-driftwood">{weatherCodeToLabel(weather.current.weatherCode)}</p>
            </div>
          </div>
        )}

        {/* Wind */}
        {weather && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sand">
            <Wind className="w-6 h-6 text-atlantic-blue" />
            <div>
              <p className="text-xs text-driftwood">Wind</p>
              <p className="stat-number text-lg">
                {Math.round(weather.current.windSpeed)} km/h
              </p>
              <p className="text-[10px] text-driftwood">
                {windDirectionLabel(weather.current.windDirection)}
                {weather.current.windGusts > weather.current.windSpeed && (
                  <span> (gusts {Math.round(weather.current.windGusts)})</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Precipitation */}
        {weather && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sand">
            <Droplets className="w-6 h-6 text-shallows" />
            <div>
              <p className="text-xs text-driftwood">Precipitation</p>
              <p className="stat-number text-lg">
                {weather.current.precipitationProbability} mm
              </p>
            </div>
          </div>
        )}

        {/* Water Level */}
        {hubeauStationCode && waterLevel && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sand">
            <ArrowUp className="w-6 h-6 text-atlantic-blue" />
            <div>
              <p className="text-xs text-driftwood">Water Level</p>
              <p className="stat-number text-lg">
                {formatWaterLevel(waterLevel.level)}
              </p>
              <p className={`text-[10px] font-semibold ${trendColor(waterLevel.trend)}`}>
                {trendIcon(waterLevel.trend)} {waterLevel.trend}
              </p>
            </div>
          </div>
        )}

        {hubeauStationCode && !waterLevel && !loading && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sand">
            <ArrowUp className="w-6 h-6 text-driftwood/30" />
            <div>
              <p className="text-xs text-driftwood">Water Level</p>
              <p className="text-xs text-driftwood">No data available</p>
            </div>
          </div>
        )}

        {/* Sunrise / Sunset */}
        {sunTimes && (
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-sand ${!hubeauStationCode ? 'col-span-2' : ''}`}>
            <div className="flex flex-col items-center gap-1">
              <Sunrise className="w-5 h-5 text-sunset-coral" />
              <Sunset className="w-5 h-5 text-deep-ocean" />
            </div>
            <div>
              <p className="text-xs text-driftwood">Sun</p>
              <p className="text-sm text-storm-grey">
                <span className="font-semibold">{formatTime(sunTimes.sunrise)}</span>
                <span className="text-driftwood mx-1">-</span>
                <span className="font-semibold">{formatTime(sunTimes.sunset)}</span>
              </p>
              <p className="text-[10px] text-driftwood">{sunTimes.dayLength}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

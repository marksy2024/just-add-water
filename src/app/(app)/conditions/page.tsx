import { prisma } from '@/lib/db'
import { getWeather, weatherCodeToIcon, weatherCodeToLabel, windDirectionLabel } from '@/lib/weather'
import { getWaterLevel } from '@/lib/water-level'
import { getSunTimes, formatTime, formatDayLength } from '@/lib/sun'
import { rankRoutes, type RouteScoreInput } from '@/lib/route-scoring'
import { Card, CardTitle } from '@/components/ui/Card'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { ConditionsCard } from '@/components/routes/ConditionsCard'
import { RouteSuggestions } from '@/components/routes/RouteSuggestions'
import { Wind, Sunrise, Sunset, AlertTriangle, MapPin } from 'lucide-react'

// Vendee centroid for regional overview
const VENDEE_LAT = 46.67
const VENDEE_LNG = -1.43

export default async function ConditionsPage() {
  // Fetch routes and regional data in parallel
  const [
    routes,
    weather,
    sunTimes,
  ] = await Promise.all([
    prisma.route.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        difficulty: true,
        distanceKm: true,
        putInLat: true,
        putInLng: true,
        takeOutLat: true,
        takeOutLng: true,
        geojson: true,
        bestSeasonNotes: true,
        hubeauStationCode: true,
      },
      orderBy: { name: 'asc' },
    }),
    getWeather(VENDEE_LAT, VENDEE_LNG).catch(() => null),
    getSunTimes(VENDEE_LAT, VENDEE_LNG).catch(() => null),
  ])

  // Filter to routes that have coordinates or water station
  const conditionsRoutes = routes?.filter(
    (r) => (r.putInLat && r.putInLng) || r.hubeauStationCode
  ) || []

  // Hunting season check: Sept (8) through Feb (1)
  const currentMonth = new Date().getMonth() // 0-indexed
  const isHuntingSeason = currentMonth >= 8 || currentMonth <= 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-deep-ocean">Conditions</h1>
        <p className="text-sm text-driftwood mt-0.5">
          Weather, water levels &amp; paddling conditions
        </p>
      </div>

      {/* Hunting Season Warning */}
      {isHuntingSeason && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-buoy/10 border border-amber-buoy/20">
          <AlertTriangle className="w-5 h-5 text-amber-buoy shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-buoy">
              Hunting season is active
            </p>
            <p className="text-xs text-driftwood mt-0.5">
              Wear bright colours on riverbank routes. Hunting runs September through February in the Vend&eacute;e.
            </p>
          </div>
        </div>
      )}

      {/* Regional Weather Overview */}
      {weather && (
        <Card>
          <CardTitle className="mb-4">Vend&eacute;e Overview</CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-4xl">
              {weatherCodeToIcon(weather.current.weatherCode, weather.current.isDay)}
            </span>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="stat-number text-3xl">
                  {Math.round(weather.current.temperature)}&deg;C
                </span>
                <span className="text-sm text-driftwood">
                  {weatherCodeToLabel(weather.current.weatherCode)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-driftwood">
                  <Wind className="w-3.5 h-3.5" />
                  {Math.round(weather.current.windSpeed)} km/h {windDirectionLabel(weather.current.windDirection)}
                  {weather.current.windGusts > weather.current.windSpeed && (
                    <span className="text-driftwood/70">
                      (gusts {Math.round(weather.current.windGusts)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 3-day forecast */}
          {weather.daily.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-storm-grey/10">
              {weather.daily.map((day) => (
                <div key={day.date} className="text-center">
                  <p className="text-[10px] text-driftwood font-medium">
                    {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                  </p>
                  <p className="text-sm font-semibold text-deep-ocean mt-0.5">
                    {Math.round(day.tempMax)}&deg; / {Math.round(day.tempMin)}&deg;
                  </p>
                  <p className="text-[10px] text-driftwood">
                    <Wind className="w-2.5 h-2.5 inline" /> {Math.round(day.windMax)} km/h
                  </p>
                  {day.precipSum > 0 && (
                    <p className="text-[10px] text-atlantic-blue font-medium">
                      {day.precipSum.toFixed(1)}mm
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Sunrise / Sunset */}
      {sunTimes && (
        <Card padding="sm">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <Sunrise className="w-5 h-5 text-sunset-coral" />
              <div>
                <p className="text-[10px] text-driftwood">Sunrise</p>
                <p className="text-sm font-semibold text-deep-ocean">
                  {formatTime(sunTimes.sunrise)}
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-storm-grey/10" />
            <div className="flex items-center gap-2">
              <Sunset className="w-5 h-5 text-deep-ocean" />
              <div>
                <p className="text-[10px] text-driftwood">Sunset</p>
                <p className="text-sm font-semibold text-deep-ocean">
                  {formatTime(sunTimes.sunset)}
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-storm-grey/10" />
            <div>
              <p className="text-[10px] text-driftwood">Day Length</p>
              <p className="text-sm font-semibold text-deep-ocean">
                {formatDayLength(sunTimes.dayLength)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Suggested Paddles — ranked top 3 */}
      {await (async () => {
        if (conditionsRoutes.length === 0) return null

        // Fetch weather + water level per route in parallel
        const routeData = await Promise.all(
          conditionsRoutes.map(async (route) => {
            try {
              const lat = Number(route.putInLat) || VENDEE_LAT
              const lng = Number(route.putInLng) || VENDEE_LNG
              const [routeWeather, routeWater] = await Promise.allSettled([
                getWeather(lat, lng),
                route.hubeauStationCode ? getWaterLevel(route.hubeauStationCode) : Promise.resolve(null),
              ])
              return {
                route: {
                  id: route.id,
                  name: route.name,
                  type: route.type,
                  distanceKm: route.distanceKm ? Number(route.distanceKm) : null,
                  putInLat: route.putInLat ? Number(route.putInLat) : null,
                  putInLng: route.putInLng ? Number(route.putInLng) : null,
                  takeOutLat: route.takeOutLat ? Number(route.takeOutLat) : null,
                  takeOutLng: route.takeOutLng ? Number(route.takeOutLng) : null,
                  geojson: route.geojson,
                  bestSeasonNotes: route.bestSeasonNotes,
                },
                weather: routeWeather.status === 'fulfilled' ? routeWeather.value : null,
                waterLevel: routeWater.status === 'fulfilled' ? routeWater.value : null,
                sunTimes,
              } as RouteScoreInput
            } catch {
              return null
            }
          })
        )

        const validInputs = routeData.filter((d): d is RouteScoreInput => d !== null)
        const ranked = rankRoutes(validInputs)
        const top3 = ranked.slice(0, 3)

        return <RouteSuggestions scores={top3} />
      })()}

      <WaveDividerSubtle />

      {/* Route Conditions Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Route Conditions
          </h2>
        </div>

        {conditionsRoutes.length > 0 ? (
          <div className="space-y-4">
            {conditionsRoutes.map((route) => (
              <div key={route.id}>
                <p className="text-sm font-semibold text-deep-ocean mb-2">
                  {route.name}
                  <span className="ml-2 text-xs font-normal text-driftwood capitalize">
                    {route.type}
                  </span>
                </p>
                <ConditionsCard
                  lat={Number(route.putInLat) || VENDEE_LAT}
                  lng={Number(route.putInLng) || VENDEE_LNG}
                  hubeauStationCode={route.hubeauStationCode}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-driftwood text-center py-4">
              No routes with location data yet. Add coordinates to your routes to see conditions here.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

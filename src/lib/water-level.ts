// Hub'Eau Hydrométrie API — real-time water levels for French rivers

export interface WaterLevelData {
  stationCode: string
  stationName: string
  level: number
  timestamp: string
  trend: 'rising' | 'stable' | 'falling'
  trendDelta: number
}

export async function getWaterLevel(stationCode: string): Promise<WaterLevelData | null> {
  try {
    // Get the latest observation
    const latestRes = await fetch(
      `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=${stationCode}&size=1&grandeur_hydro=H&sort=desc`,
      { next: { revalidate: 1800 } }
    )
    if (!latestRes.ok) return null
    const latestData = await latestRes.json()

    if (!latestData.data?.length) return null
    const latest = latestData.data[0]

    // Get 24 hours of data for trend
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const trendRes = await fetch(
      `https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=${stationCode}&size=48&grandeur_hydro=H&date_debut_obs=${yesterday.toISOString()}&sort=asc`,
      { next: { revalidate: 1800 } }
    )

    let trend: 'rising' | 'stable' | 'falling' = 'stable'
    let trendDelta = 0

    if (trendRes.ok) {
      const trendData = await trendRes.json()
      if (trendData.data?.length >= 2) {
        const first = trendData.data[0].resultat_obs
        const last = trendData.data[trendData.data.length - 1].resultat_obs
        trendDelta = last - first
        if (trendDelta > 20) trend = 'rising'      // >20mm rise
        else if (trendDelta < -20) trend = 'falling' // >20mm fall
      }
    }

    return {
      stationCode,
      stationName: latest.libelle_station || stationCode,
      level: latest.resultat_obs, // in mm
      timestamp: latest.date_obs,
      trend,
      trendDelta,
    }
  } catch {
    return null
  }
}

export function trendIcon(trend: 'rising' | 'stable' | 'falling'): string {
  return trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→'
}

export function trendColor(trend: 'rising' | 'stable' | 'falling'): string {
  return trend === 'rising' ? 'text-amber-buoy' : trend === 'falling' ? 'text-atlantic-blue' : 'text-kelp-green'
}

export function formatWaterLevel(mm: number): string {
  return `${(mm / 1000).toFixed(2)}m`
}

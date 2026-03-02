// Client-side sunrise/sunset calculation
// Using the sunrise-sunset.org API for simplicity

export interface SunTimes {
  sunrise: string
  sunset: string
  civilTwilightBegin: string
  civilTwilightEnd: string
  dayLength: string | number
}

export async function getSunTimes(lat: number, lng: number, date?: string): Promise<SunTimes | null> {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0]
    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateParam}&formatted=0`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'OK') return null

    return {
      sunrise: data.results.sunrise,
      sunset: data.results.sunset,
      civilTwilightBegin: data.results.civil_twilight_begin,
      civilTwilightEnd: data.results.civil_twilight_end,
      dayLength: data.results.day_length,
    }
  } catch {
    return null
  }
}

export function formatDayLength(dayLength: string | number): string {
  if (typeof dayLength === 'number') {
    const h = Math.floor(dayLength / 3600)
    const m = Math.floor((dayLength % 3600) / 60)
    return `${h}h ${String(m).padStart(2, '0')}min`
  }
  // Already a string like "12:30:00" — convert to readable
  const parts = dayLength.split(':')
  if (parts.length >= 2) {
    return `${parseInt(parts[0], 10)}h ${parts[1]}min`
  }
  return dayLength
}

export function formatTime(isoString: string, timezone = 'Europe/Paris'): string {
  return new Date(isoString).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })
}

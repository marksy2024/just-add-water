// Open-Meteo Météo-France API integration for Vendée region

const VENDEE_LAT = 46.67
const VENDEE_LNG = -1.43

export interface WeatherData {
  temperature: number
  windSpeed: number
  windDirection: number
  windGusts: number
  precipitationProbability: number
  weatherCode: number
  isDay: boolean
}

export interface WeatherForecast {
  current: WeatherData
  hourly: { time: string; temperature: number; windSpeed: number; precipitation: number }[]
  daily: { date: string; tempMax: number; tempMin: number; precipSum: number; windMax: number }[]
}

export async function getWeather(lat = VENDEE_LAT, lng = VENDEE_LNG): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code,is_day',
    hourly: 'temperature_2m,wind_speed_10m,precipitation_probability',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    forecast_days: '3',
    timezone: 'Europe/Paris',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/meteofrance?${params}`, {
    next: { revalidate: 1800 }, // Cache for 30 minutes
  })

  if (!res.ok) throw new Error('Weather fetch failed')
  const data = await res.json()

  return {
    current: {
      temperature: data.current.temperature_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      windGusts: data.current.wind_gusts_10m,
      precipitationProbability: data.current.precipitation,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly: data.hourly.time.map((time: string, i: number) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      precipitation: data.hourly.precipitation_probability[i],
    })),
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipSum: data.daily.precipitation_sum[i],
      windMax: data.daily.wind_speed_10m_max[i],
    })),
  }
}

export function weatherCodeToLabel(code: number): string {
  const labels: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  }
  return labels[code] || 'Unknown'
}

export function weatherCodeToIcon(code: number, isDay = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code <= 3) return isDay ? '⛅' : '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 75) return '🌨️'
  if (code <= 82) return '🌧️'
  return '⛈️'
}

export function windDirectionLabel(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(degrees / 45) % 8]
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatRelativeDate(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(dateStr)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export function getDashboardGreeting(name: string): string {
  const hour = new Date().getHours()
  const greetings = {
    morning: [
      `Morning ${name} — the water's calling`,
      `Good morning ${name} — perfect day for a paddle?`,
      `Rise and shine ${name} — the river awaits`,
    ],
    afternoon: [
      `Afternoon ${name} — planning your next paddle?`,
      `Hey ${name} — fancy getting on the water?`,
      `Good afternoon ${name} — time to check conditions?`,
    ],
    evening: [
      `Evening ${name} — logging today's paddle?`,
      `Hey ${name} — how was the water today?`,
      `Good evening ${name} — planning a weekend paddle?`,
    ],
  }

  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const options = greetings[period]
  // Use day of year for consistent daily greeting
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  return options[dayOfYear % options.length]
}

export function getISOWeek(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

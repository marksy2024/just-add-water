import { prisma } from '@/lib/db'
import { getISOWeek } from '@/lib/utils'

interface StreakResult {
  userId: string
  currentStreakWeeks: number
  longestStreakWeeks: number
  streakStartDate: string | null
  lastPaddleWeek: string | null
}

/**
 * Recalculates and updates the paddle streak for a given user.
 *
 * A streak counts consecutive ISO weeks (Mon-Sun) where the user
 * participated in at least one completed paddle. The current week
 * always counts if the user has paddled in it.
 */
export async function updateStreak(userId: string): Promise<StreakResult> {
  // Fetch all completed paddles for this user, ordered by date
  const participations = await prisma.paddleParticipant.findMany({
    where: {
      userId,
      paddle: { status: 'completed' },
    },
    select: {
      paddle: {
        select: { date: true, status: true },
      },
    },
  })

  // Collect unique ISO weeks that have at least one paddle
  const weekSet = new Set<string>()

  for (const p of participations) {
    if (p.paddle.date) {
      const week = getISOWeek(new Date(p.paddle.date))
      weekSet.add(week)
    }
  }

  // Sort weeks in descending order (most recent first)
  const sortedWeeks = Array.from(weekSet).sort().reverse()

  // Current ISO week
  const now = new Date()
  const currentWeek = getISOWeek(now)

  // Calculate consecutive streak counting backwards from the current week
  let currentStreakWeeks = 0
  let streakStartDate: string | null = null
  const lastPaddleWeek: string | null = sortedWeeks[0] || null

  if (sortedWeeks.length > 0) {
    // Start from the current week or the most recent paddle week
    // The streak only counts if the user paddled this week or last week
    const mostRecentWeek = sortedWeeks[0]

    // Check if the most recent paddle was this week or the previous week
    const currentWeekDate = isoWeekToDate(currentWeek)
    const recentWeekDate = isoWeekToDate(mostRecentWeek)
    const weekDiffMs = currentWeekDate.getTime() - recentWeekDate.getTime()
    const weekDiff = Math.round(weekDiffMs / (7 * 24 * 60 * 60 * 1000))

    // Streak is only active if user paddled within the last 1 week (current or previous)
    if (weekDiff <= 1) {
      currentStreakWeeks = 1
      streakStartDate = mostRecentWeek

      // Walk backwards through sorted weeks to find consecutive run
      for (let i = 1; i < sortedWeeks.length; i++) {
        const thisWeekDate = isoWeekToDate(sortedWeeks[i - 1])
        const prevWeekDate = isoWeekToDate(sortedWeeks[i])
        const diffMs = thisWeekDate.getTime() - prevWeekDate.getTime()
        const diff = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))

        if (diff === 1) {
          currentStreakWeeks++
          streakStartDate = sortedWeeks[i]
        } else {
          break
        }
      }
    }
  }

  // Fetch existing streak to preserve longestStreakWeeks
  const existingStreak = await prisma.userStreak.findUnique({
    where: { userId },
    select: { longestStreakWeeks: true },
  })

  const longestStreakWeeks = Math.max(
    currentStreakWeeks,
    existingStreak?.longestStreakWeeks || 0
  )

  // Upsert the streak record
  // streakStartDate is stored as a Date in Prisma (DateTime @db.Date),
  // so we convert the ISO week string to the Monday of that week
  const streakStartDateValue = streakStartDate
    ? isoWeekToDate(streakStartDate)
    : null

  await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentStreakWeeks,
      longestStreakWeeks,
      streakStartDate: streakStartDateValue,
      lastPaddleWeek,
    },
    update: {
      currentStreakWeeks,
      longestStreakWeeks,
      streakStartDate: streakStartDateValue,
      lastPaddleWeek,
    },
  })

  return {
    userId,
    currentStreakWeeks,
    longestStreakWeeks,
    streakStartDate,
    lastPaddleWeek,
  }
}

/**
 * Converts an ISO week string (e.g. "2026-W09") to a Date
 * representing the Monday of that week.
 */
function isoWeekToDate(isoWeek: string): Date {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // January 4th is always in ISO week 1
  const jan4 = new Date(year, 0, 4)
  // Find the Monday of week 1
  const dayOfWeek = jan4.getDay() || 7 // Convert Sunday(0) to 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Add the target weeks
  monday.setDate(monday.getDate() + (week - 1) * 7)

  return monday
}

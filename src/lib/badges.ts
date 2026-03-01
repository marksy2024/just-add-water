import { prisma } from '@/lib/db'
import type { BadgeDefinition } from '@/generated/prisma/client'

interface NewBadge {
  id: string
  badge: BadgeDefinition
  earnedAt: Date
}

/**
 * Evaluates all unearned badges for a user and awards any newly qualifying ones.
 * Returns an array of newly earned badges for notification display.
 */
export async function evaluateBadges(userId: string): Promise<NewBadge[]> {
  // Run all queries in parallel for efficiency
  const [
    participantsWithPaddles,
    completedPaddleCount,
    streak,
    definitions,
    earnedBadges,
    uniqueRouteCount,
    groupPaddleCount,
    paddledTypes,
  ] = await Promise.all([
    // All participant entries for this user, including the parent paddle's
    // distance and status so we can compute total distance from completed paddles
    prisma.paddleParticipant.findMany({
      where: { userId },
      select: {
        distanceKm: true,
        paddle: {
          select: { distanceKm: true, status: true },
        },
      },
    }),

    // Total completed paddle count
    prisma.paddleParticipant.count({
      where: {
        userId,
        paddle: { status: 'completed' },
      },
    }),

    // Current streak
    prisma.userStreak.findUnique({
      where: { userId },
      select: { currentStreakWeeks: true, longestStreakWeeks: true },
    }),

    // All badge definitions
    prisma.badgeDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
    }),

    // Already earned badges for this user
    prisma.badgeEarned.findMany({
      where: { userId },
      select: { badgeId: true },
    }),

    // Count distinct routes paddled (for unique_routes badge)
    prisma.paddleParticipant.findMany({
      where: {
        userId,
        paddle: { status: 'completed', routeId: { not: null } },
      },
      select: { paddle: { select: { routeId: true } } },
      distinct: ['paddleId'],
    }),

    // Count paddles with 2+ going participants (for group_paddles badge)
    prisma.paddleParticipant.findMany({
      where: {
        userId,
        rsvp: 'going',
        paddle: { status: 'completed' },
      },
      select: {
        paddleId: true,
        paddle: {
          select: {
            _count: { select: { participants: { where: { rsvp: 'going' } } } },
          },
        },
      },
    }),

    // Distinct water types paddled (for all_types badge)
    prisma.paddleParticipant.findMany({
      where: {
        userId,
        paddle: { status: 'completed', route: { isNot: null } },
      },
      select: { paddle: { select: { route: { select: { type: true } } } } },
    }),
  ])

  // Calculate total distance from completed paddles only
  const totalKm = participantsWithPaddles.reduce((sum, p) => {
    if (p.paddle.status !== 'completed') return sum
    const participantDist = p.distanceKm ? Number(p.distanceKm) : 0
    const paddleDist = p.paddle.distanceKm ? Number(p.paddle.distanceKm) : 0
    return sum + (participantDist || paddleDist)
  }, 0)

  const totalPaddles = completedPaddleCount
  const currentStreakWeeks = streak?.currentStreakWeeks || 0

  // Variety badge computed values
  const uniqueRoutes = new Set(
    uniqueRouteCount.map((p) => p.paddle.routeId).filter(Boolean)
  ).size
  const groupPaddles = groupPaddleCount.filter(
    (p) => p.paddle._count.participants >= 2
  ).length
  const typesSet = new Set(
    paddledTypes.map((p) => p.paddle.route?.type).filter(Boolean)
  )
  const uniqueTypesCount = typesSet.size

  // Build a set of already-earned badge IDs for O(1) lookup
  const earnedBadgeIds = new Set(
    earnedBadges.map((b) => b.badgeId)
  )

  // Check each unearned badge definition against criteria
  const newlyQualified: BadgeDefinition[] = []

  for (const badge of definitions) {
    if (earnedBadgeIds.has(badge.id)) continue

    const criteria = badge.criteria as { type?: string; threshold?: number }
    if (!criteria?.type || criteria.threshold == null) continue

    let qualifies = false

    switch (criteria.type) {
      case 'distance':
        qualifies = totalKm >= criteria.threshold
        break
      case 'total_distance':
        qualifies = totalKm >= criteria.threshold
        break
      case 'count':
        qualifies = totalPaddles >= criteria.threshold
        break
      case 'total_paddles':
        qualifies = totalPaddles >= criteria.threshold
        break
      case 'streak':
        qualifies = currentStreakWeeks >= criteria.threshold
        break
      case 'streak_weeks':
        qualifies = currentStreakWeeks >= criteria.threshold
        break
      case 'unique_routes':
        qualifies = uniqueRoutes >= criteria.threshold
        break
      case 'group_paddles':
        qualifies = groupPaddles >= criteria.threshold
        break
      case 'all_types':
        qualifies = uniqueTypesCount >= criteria.threshold
        break
      default:
        break
    }

    if (qualifies) {
      newlyQualified.push(badge)
    }
  }

  // Insert all newly earned badges in one batch
  if (newlyQualified.length === 0) {
    return []
  }

  try {
    const inserted = await prisma.$transaction(
      newlyQualified.map((badge) =>
        prisma.badgeEarned.create({
          data: {
            userId,
            badgeId: badge.id,
          },
          select: { id: true, badgeId: true, earnedAt: true },
        })
      )
    )

    // Map inserted records back to their badge definitions
    const badgeMap = new Map(
      newlyQualified.map((b) => [b.id, b])
    )

    return inserted.map((record) => ({
      id: record.id,
      badge: badgeMap.get(record.badgeId)!,
      earnedAt: record.earnedAt,
    }))
  } catch (error) {
    console.error('Failed to insert earned badges:', error)
    return []
  }
}

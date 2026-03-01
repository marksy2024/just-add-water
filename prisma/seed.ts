import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const badges = [
  // Distance badges
  {
    slug: 'distance-1k',
    name: 'First Kilometre',
    description: 'Paddle your first kilometre',
    icon: '🏅',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 1 },
    sortOrder: 1,
  },
  {
    slug: 'distance-10k',
    name: '10k Paddler',
    description: 'Paddle 10 kilometres total',
    icon: '🥉',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 10 },
    sortOrder: 2,
  },
  {
    slug: 'distance-50k',
    name: '50k Voyager',
    description: 'Paddle 50 kilometres total',
    icon: '🥈',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 50 },
    sortOrder: 3,
  },
  {
    slug: 'distance-100k',
    name: '100k Explorer',
    description: 'Paddle 100 kilometres total',
    icon: '🥇',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 100 },
    sortOrder: 4,
  },
  {
    slug: 'distance-250k',
    name: '250k Navigator',
    description: 'Paddle 250 kilometres total',
    icon: '🏆',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 250 },
    sortOrder: 5,
  },
  {
    slug: 'distance-500k',
    name: '500k Legend',
    description: 'Paddle 500 kilometres total',
    icon: '👑',
    category: 'distance',
    criteria: { type: 'total_distance', threshold: 500 },
    sortOrder: 6,
  },

  // Count badges
  {
    slug: 'count-1',
    name: 'First Paddle',
    description: 'Complete your first paddle',
    icon: '🛶',
    category: 'count',
    criteria: { type: 'total_paddles', threshold: 1 },
    sortOrder: 10,
  },
  {
    slug: 'count-10',
    name: '10 Paddles',
    description: 'Complete 10 paddles',
    icon: '🌊',
    category: 'count',
    criteria: { type: 'total_paddles', threshold: 10 },
    sortOrder: 11,
  },
  {
    slug: 'count-25',
    name: '25 Paddles',
    description: 'Complete 25 paddles',
    icon: '💪',
    category: 'count',
    criteria: { type: 'total_paddles', threshold: 25 },
    sortOrder: 12,
  },
  {
    slug: 'count-50',
    name: '50 Paddles',
    description: 'Complete 50 paddles',
    icon: '⭐',
    category: 'count',
    criteria: { type: 'total_paddles', threshold: 50 },
    sortOrder: 13,
  },

  // Streak badges
  {
    slug: 'streak-2wk',
    name: '2-Week Streak',
    description: 'Paddle every week for 2 weeks',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak_weeks', threshold: 2 },
    sortOrder: 20,
  },
  {
    slug: 'streak-4wk',
    name: '4-Week Streak',
    description: 'Paddle every week for a month',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak_weeks', threshold: 4 },
    sortOrder: 21,
  },
  {
    slug: 'streak-8wk',
    name: '8-Week Streak',
    description: 'Paddle every week for 2 months',
    icon: '🔥',
    category: 'streak',
    criteria: { type: 'streak_weeks', threshold: 8 },
    sortOrder: 22,
  },

  // Variety badges
  {
    slug: 'variety-explorer',
    name: 'Explorer',
    description: 'Paddle 5 different routes',
    icon: '🗺️',
    category: 'variety',
    criteria: { type: 'unique_routes', threshold: 5 },
    sortOrder: 30,
  },
  {
    slug: 'variety-cartographer',
    name: 'Cartographer',
    description: 'Paddle 10 different routes',
    icon: '🧭',
    category: 'variety',
    criteria: { type: 'unique_routes', threshold: 10 },
    sortOrder: 31,
  },
  {
    slug: 'variety-all-rounder',
    name: 'All-Rounder',
    description: 'Paddle all 4 water types: river, lake, coastal, canal',
    icon: '🌍',
    category: 'variety',
    criteria: { type: 'all_types', threshold: 4 },
    sortOrder: 32,
  },
  {
    slug: 'variety-social',
    name: 'Social Paddler',
    description: 'Join 10 group paddles with 2+ paddlers',
    icon: '🤝',
    category: 'variety',
    criteria: { type: 'group_paddles', threshold: 10 },
    sortOrder: 33,
  },
]

async function main() {
  console.log('Seeding badge definitions...')

  for (const badge of badges) {
    await prisma.badgeDefinition.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        category: badge.category,
        criteria: badge.criteria,
        sortOrder: badge.sortOrder,
      },
      create: badge,
    })
    console.log(`  ${badge.icon} ${badge.name}`)
  }

  console.log(`\nSeeded ${badges.length} badge definitions.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

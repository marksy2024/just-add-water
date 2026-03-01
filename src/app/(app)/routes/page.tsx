import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDistance } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { TypeBadge, DifficultyBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Plus, MapPin, Waves, Calendar } from 'lucide-react'

export default async function RoutesPage() {
  await auth()

  // Fetch all routes with creator info
  const routes = await prisma.route.findMany({
    include: {
      creator: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch paddle counts per route
  const routeIds = routes.map((r) => r.id)
  let paddleCounts: Record<string, number> = {}

  if (routeIds.length > 0) {
    const paddles = await prisma.paddle.findMany({
      where: { routeId: { in: routeIds } },
      select: { routeId: true },
    })

    paddleCounts = paddles.reduce((acc, p) => {
      if (p.routeId) {
        acc[p.routeId] = (acc[p.routeId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-deep-ocean">Routes</h1>
          <p className="text-sm text-driftwood mt-0.5">
            Your paddling route library
          </p>
        </div>
        <Link href="/routes/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Add Route
          </Button>
        </Link>
      </div>

      {/* Route Cards */}
      {routes && routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => {
            const creator = route.creator
            const paddleCount = paddleCounts[route.id] || 0

            return (
              <Link key={route.id} href={`/routes/${route.id}`}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-deep-ocean leading-tight">
                      {route.name}
                    </h3>
                    <TypeBadge type={route.type} size="sm" />
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <DifficultyBadge difficulty={route.difficulty} />
                    {route.distanceKm && (
                      <span className="flex items-center gap-1 text-xs text-driftwood">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(Number(route.distanceKm))}
                      </span>
                    )}
                  </div>

                  {route.bestSeasonNotes && (
                    <p className="text-xs text-driftwood mb-3 line-clamp-2">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {route.bestSeasonNotes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-storm-grey/10">
                    <span className="flex items-center gap-1 text-xs text-driftwood">
                      <Waves className="w-3.5 h-3.5" />
                      {paddleCount === 0
                        ? 'Not yet paddled'
                        : `Paddled ${paddleCount} time${paddleCount !== 1 ? 's' : ''}`}
                    </span>
                    {creator && (
                      <span className="text-xs text-driftwood">
                        by {creator.name}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No routes saved yet"
          description="Add your first paddling route to start building the group's route library."
          action={{ label: 'Add Route', href: '/routes/new' }}
        />
      )}
    </div>
  )
}

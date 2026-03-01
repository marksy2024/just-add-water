import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDistance, formatRelativeDate } from '@/lib/utils'
import { Card, CardTitle } from '@/components/ui/Card'
import { TypeBadge, DifficultyBadge, CommentTypeBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { ConditionsCard } from '@/components/routes/ConditionsCard'
import { RouteCommentForm } from '@/components/routes/RouteCommentForm'
import Link from 'next/link'
import { RouteMap } from '@/components/maps/RouteMap'
import {
  MapPin,
  Waves,
  Calendar,
  ArrowLeft,
  Pin,
  Download,
  Image as ImageIcon,
} from 'lucide-react'

interface RouteDetailPageProps {
  params: Promise<{ id: string }>
}

const photoTypeLabels: Record<string, string> = {
  all: 'All',
  scenic: 'Scenic',
  access: 'Access',
  hazard: 'Hazard',
  put_in: 'Put-in',
  take_out: 'Take-out',
  parking: 'Parking',
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { id } = await params
  await auth()

  // Fetch route, comments, photos, and paddle count in parallel
  const [
    route,
    comments,
    photos,
    paddleCount,
  ] = await Promise.all([
    prisma.route.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, image: true } },
      },
    }),
    prisma.routeComment.findMany({
      where: { routeId: id },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.routePhoto.findMany({
      where: { routeId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paddle.count({
      where: { routeId: id },
    }),
  ])

  if (!route) notFound()

  const creator = route.creator

  // Build WhatsApp share message
  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://justaddwater.app'}/routes/${route.id}`
  const whatsappMessage = [
    `\u{1F6F6} Route: ${route.name}`,
    `\u{1F4CF} ${route.distanceKm ? `${Number(route.distanceKm)}km` : ''} ${route.type}`,
    route.difficulty ? `Difficulty: ${route.difficulty}` : '',
    `\u{1F449} ${appUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/routes"
        className="inline-flex items-center gap-1 text-sm text-atlantic-blue hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        All Routes
      </Link>

      {/* Route header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-extrabold text-deep-ocean leading-tight">
            {route.name}
          </h1>
          <TypeBadge type={route.type} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-driftwood">
          <DifficultyBadge difficulty={route.difficulty} />
          {route.distanceKm && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {formatDistance(Number(route.distanceKm))}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Waves className="w-3.5 h-3.5" />
            {paddleCount === 0
              ? 'Not yet paddled'
              : `Paddled ${paddleCount} time${paddleCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        {creator && (
          <p className="text-xs text-driftwood mt-2">
            Added by {creator.name} on {formatDate(route.createdAt)}
          </p>
        )}
      </div>

      {/* Put-in / Take-out */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card padding="sm">
          <p className="text-[10px] font-semibold text-kelp-green uppercase tracking-wide mb-1">
            Put-in
          </p>
          <p className="text-sm text-storm-grey">
            {route.putInDescription || 'No description'}
          </p>
          {route.putInLat && route.putInLng && (
            <p className="text-[10px] text-driftwood mt-1">
              {Number(route.putInLat).toFixed(5)}, {Number(route.putInLng).toFixed(5)}
            </p>
          )}
        </Card>

        <Card padding="sm">
          <p className="text-[10px] font-semibold text-sunset-coral uppercase tracking-wide mb-1">
            Take-out
          </p>
          <p className="text-sm text-storm-grey">
            {route.takeOutDescription || 'No description'}
          </p>
          {route.takeOutLat && route.takeOutLng && (
            <p className="text-[10px] text-driftwood mt-1">
              {Number(route.takeOutLat).toFixed(5)}, {Number(route.takeOutLng).toFixed(5)}
            </p>
          )}
        </Card>
      </div>

      {/* Route Map */}
      {(route.geojson || (route.putInLat && route.putInLng)) && (
        <RouteMap
          geojson={route.geojson as Record<string, unknown> | null}
          putIn={route.putInLat && route.putInLng ? {
            lat: Number(route.putInLat),
            lng: Number(route.putInLng),
            description: route.putInDescription,
          } : undefined}
          takeOut={route.takeOutLat && route.takeOutLng ? {
            lat: Number(route.takeOutLat),
            lng: Number(route.takeOutLng),
            description: route.takeOutDescription,
          } : undefined}
          photos={photos.filter(p => p.locationLat && p.locationLng).map(p => ({
            id: p.id,
            lat: Number(p.locationLat),
            lng: Number(p.locationLng),
            thumbnailUrl: p.thumbnailUrl || p.storageUrl,
            caption: p.caption,
          }))}
        />
      )}

      {/* Current Conditions */}
      {route.putInLat && route.putInLng && (
        <ConditionsCard
          lat={Number(route.putInLat)}
          lng={Number(route.putInLng)}
          hubeauStationCode={route.hubeauStationCode}
        />
      )}

      {/* Best Season & Water Level Notes */}
      {(route.bestSeasonNotes || route.minWaterLevelNotes) && (
        <Card>
          {route.bestSeasonNotes && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-deep-ocean uppercase tracking-wide mb-1">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Best Season
              </p>
              <p className="text-sm text-storm-grey">{route.bestSeasonNotes}</p>
            </div>
          )}
          {route.minWaterLevelNotes && (
            <div>
              <p className="text-xs font-semibold text-deep-ocean uppercase tracking-wide mb-1">
                <Waves className="w-3.5 h-3.5 inline mr-1" />
                Minimum Water Level
              </p>
              <p className="text-sm text-storm-grey">{route.minWaterLevelNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Description */}
      {route.description && (
        <Card>
          <CardTitle className="mb-2">Description</CardTitle>
          <p className="text-sm text-storm-grey whitespace-pre-line">{route.description}</p>
        </Card>
      )}

      <WaveDividerSubtle />

      {/* Comments */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          Comments ({comments?.length || 0})
        </h2>

        {comments && comments.length > 0 ? (
          <div className="space-y-3 mb-6">
            {comments.map((comment) => {
              const commentUser = comment.user
              const isHazard = comment.commentType === 'hazard'

              return (
                <Card
                  key={comment.id}
                  padding="sm"
                  className={isHazard ? 'comment-hazard' : ''}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-deep-ocean">
                        {commentUser?.name || 'Unknown'}
                      </span>
                      <CommentTypeBadge type={comment.commentType} />
                      {comment.pinned && (
                        <Pin className="w-3 h-3 text-atlantic-blue" />
                      )}
                    </div>
                    <span className="text-[10px] text-driftwood whitespace-nowrap">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-storm-grey whitespace-pre-line">
                    {comment.text}
                  </p>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card padding="sm" className="mb-6">
            <p className="text-sm text-driftwood text-center py-3">
              No comments yet — be the first to share info about this route.
            </p>
          </Card>
        )}

        <RouteCommentForm routeId={route.id} />
      </div>

      <WaveDividerSubtle />

      {/* Photo Gallery */}
      <div>
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide mb-3">
          Photos ({photos?.length || 0})
        </h2>

        {photos && photos.length > 0 ? (
          <PhotoGallery photos={photos} />
        ) : (
          <Card padding="sm">
            <div className="text-center py-6">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-driftwood/30" />
              <p className="text-sm text-driftwood">No photos yet</p>
            </div>
          </Card>
        )}
      </div>

      <WaveDividerSubtle />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <WhatsAppShare message={whatsappMessage} />
        {route.geojson && (
          <a href={`/api/routes/${route.id}/gpx`} download>
            <Button variant="outline" size="sm" type="button">
              <Download className="w-4 h-4" />
              Export GPX
            </Button>
          </a>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Photo gallery with type filter tabs (server component)                      */
/* -------------------------------------------------------------------------- */

interface PhotoGalleryProps {
  photos: Array<{
    id: string
    storageUrl: string
    thumbnailUrl: string | null
    caption: string | null
    photoType: string
  }>
}

function PhotoGallery({ photos }: PhotoGalleryProps) {
  // Determine which type tabs to show based on available photos
  const availableTypes = new Set(photos.map((p) => p.photoType))
  const tabs = ['all', ...Object.keys(photoTypeLabels).filter((t) => t !== 'all' && availableTypes.has(t))]

  return (
    <div>
      {/* Type tabs as anchor links with CSS-only filtering isn't possible server-side,
          so we show all photos grouped by type */}
      {tabs.length > 2 && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <span
              key={tab}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-storm-grey/10 text-storm-grey whitespace-nowrap"
            >
              {photoTypeLabels[tab] || tab}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square bg-storm-grey/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbnailUrl || photo.storageUrl}
              alt={photo.caption || 'Route photo'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                {photoTypeLabels[photo.photoType] || photo.photoType}
              </span>
              {photo.caption && (
                <p className="text-[10px] text-white/80 truncate">{photo.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

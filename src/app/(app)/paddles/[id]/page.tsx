import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, formatDateRange, formatDuration, formatDistance } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { TypeBadge, StatusBadge, CommentTypeBadge } from '@/components/ui/Badge'
import { WhatsAppShare } from '@/components/ui/WhatsAppShare'
import { WaveDividerSubtle } from '@/components/ui/WaveDivider'
import { RSVPButtons } from '@/components/paddles/RSVPButtons'
import { FloatPlanCard } from '@/components/paddles/FloatPlanCard'
import { FloatPlanForm } from '@/components/paddles/FloatPlanForm'
import { PaddlePhotos } from '@/components/paddles/PaddlePhotos'
import { AddParticipants } from '@/components/paddles/AddParticipants'
import { FoodSection } from '@/components/paddles/FoodSection'
import { PaddleCommentForm } from '@/components/paddles/PaddleCommentForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RouteMap } from '@/components/maps/RouteMap'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ruler,
  Timer,
  Users,
  Car,
  UtensilsCrossed,
  MessageCircle,
  StickyNote,
  AlertTriangle,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaddleDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  const userId = session!.user!.id!

  // Fetch paddle with all related data
  const [
    paddle,
    participants,
    comments,
    photos,
    shuttleOffers,
    floatPlan,
    allUsers,
    foodAllocations,
  ] = await Promise.all([
    prisma.paddle.findUnique({
      where: { id },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            type: true,
            distanceKm: true,
            geojson: true,
            putInLat: true,
            putInLng: true,
            putInDescription: true,
            takeOutLat: true,
            takeOutLng: true,
            takeOutDescription: true,
          },
        },
      },
    }),
    prisma.paddleParticipant.findMany({
      where: { paddleId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: 'asc' },
    }),
    prisma.paddleComment.findMany({
      where: { paddleId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.paddlePhoto.findMany({
      where: { paddleId: id },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.shuttleOffer.findMany({
      where: { paddleId: id },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.floatPlan.findFirst({
      where: { paddleId: id, status: { in: ['active', 'overdue'] } },
      orderBy: { activatedAt: 'desc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.foodAllocation.findMany({
      where: { paddleId: id },
      select: { id: true, userId: true, category: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!paddle) notFound()

  const route = paddle.route

  const goingParticipants = participants.filter((p) => p.rsvp === 'going')
  const maybeParticipants = participants.filter((p) => p.rsvp === 'maybe')
  const currentUserParticipant = participants.find((p) => p.userId === userId)
  const organiser = participants.find((p) => p.role === 'organiser')
  const isOrganiser = organiser?.userId === userId
  const participantUserIds = participants.map((p) => p.userId)

  // Check if shuttle is needed (put-in and take-out differ)
  const needsShuttle = route &&
    route.putInLat != null && route.takeOutLat != null &&
    (Number(route.putInLat) !== Number(route.takeOutLat) || Number(route.putInLng) !== Number(route.takeOutLng))

  // Separate hazard comments for highlighting
  const hazardComments = comments.filter((c) => c.commentType === 'hazard')
  const otherComments = comments.filter((c) => c.commentType !== 'hazard')

  // WhatsApp share message
  const appLink = typeof process !== 'undefined'
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://justaddwater.app'}/paddles/${paddle.id}`
    : ''
  const timeStr = paddle.startTime ? paddle.startTime.slice(0, 5) : ''
  const whatsappMessage = [
    `\u{1F6F6} ${paddle.title}`,
    route ? `\u{1F4CD} ${route.name}` : '',
    `\u{1F4C5} ${paddle.endDate ? formatDateRange(paddle.date, paddle.endDate) : formatDate(paddle.date)}${timeStr ? `, ${timeStr}` : ''}`,
    paddle.distanceKm ? `\u{1F4CF} ${Number(paddle.distanceKm)}km` : '',
    `\u{1F449} ${appLink}`,
  ].filter(Boolean).join('\n')

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/paddles"
          className="inline-flex items-center gap-1 text-sm text-driftwood hover:text-atlantic-blue transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to paddles
        </Link>

        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-extrabold text-deep-ocean">
                {paddle.title}
              </h1>
              <StatusBadge status={paddle.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-driftwood flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {paddle.endDate
                  ? formatDateRange(paddle.date, paddle.endDate)
                  : formatDate(paddle.date)}
              </span>
              {paddle.startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {paddle.startTime.slice(0, 5)}
                </span>
              )}
              {organiser?.user && (
                <span className="text-xs">
                  Organised by{' '}
                  <span className="font-semibold text-storm-grey">
                    {organiser.userId === userId ? 'you' : organiser.user.name}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Route Info */}
      {route && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-atlantic-blue shrink-0" />
            <Link href={`/routes/${route.id}`} className="font-semibold text-deep-ocean hover:underline">
              {route.name}
            </Link>
            <TypeBadge type={route.type} size="sm" />
          </div>
        </Card>
      )}

      {/* Route Map */}
      {route && (route.geojson || (route.putInLat && route.putInLng)) && (
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
        />
      )}

      {/* Float Plan */}
      {floatPlan ? (
        <FloatPlanCard paddleId={paddle.id} floatPlan={floatPlan} />
      ) : (
        (paddle.status === 'planned' || paddle.status === 'active') && (
          <FloatPlanForm paddleId={paddle.id} />
        )
      )}

      {/* RSVP Section (for planned paddles) */}
      {paddle.status === 'planned' && (
        <RSVPButtons
          paddleId={paddle.id}
          currentRsvp={currentUserParticipant?.rsvp || null}
        />
      )}

      {/* Stats */}
      {(paddle.distanceKm || paddle.endTime) && (
        <div className="grid grid-cols-2 gap-3">
          {paddle.distanceKm && (
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-0.5">
                <Ruler className="w-4 h-4 text-atlantic-blue" />
                <span className="text-xs text-driftwood">Distance</span>
              </div>
              <p className="stat-number text-xl">{formatDistance(Number(paddle.distanceKm))}</p>
            </Card>
          )}
          {paddle.startTime && paddle.endTime && (
            <Card padding="sm">
              <div className="flex items-center gap-2 mb-0.5">
                <Timer className="w-4 h-4 text-atlantic-blue" />
                <span className="text-xs text-driftwood">Duration</span>
              </div>
              <p className="stat-number text-xl">
                {(() => {
                  const [sh, sm] = paddle.startTime!.split(':').map(Number)
                  const [eh, em] = paddle.endTime!.split(':').map(Number)
                  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
                  return formatDuration(totalMin > 0 ? totalMin : 0)
                })()}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Hazard warnings at the top */}
      {hazardComments.length > 0 && (
        <div className="space-y-2">
          {hazardComments.map((comment) => (
            <div
              key={comment.id}
              className="comment-hazard rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-sunset-coral" />
                <CommentTypeBadge type="hazard" />
                <span className="text-xs text-driftwood">
                  {comment.user?.name || 'Unknown'}
                </span>
              </div>
              <p className="text-sm text-storm-grey">{comment.text}</p>
            </div>
          ))}
        </div>
      )}

      <WaveDividerSubtle />

      {/* Participants */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Paddlers ({goingParticipants.length})
          </h2>
        </div>
        {goingParticipants.length > 0 ? (
          <div className="space-y-2">
            {goingParticipants.map((p) => (
              <Card key={p.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sea-foam flex items-center justify-center overflow-hidden shrink-0">
                      {p.user?.image ? (
                        <img
                          src={p.user.image}
                          alt={p.user.name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-atlantic-blue">
                          {(p.user?.name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-deep-ocean">
                        {p.user?.name || 'Unknown'}
                        {p.userId === userId && (
                          <span className="text-xs font-normal text-driftwood ml-1">(you)</span>
                        )}
                      </p>
                      {p.role === 'organiser' && (
                        <span className="text-[10px] font-semibold text-atlantic-blue uppercase">
                          Organiser
                        </span>
                      )}
                    </div>
                  </div>
                  {p.distanceKm && (
                    <span className="stat-number text-sm">
                      {formatDistance(Number(p.distanceKm))}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-driftwood text-center py-2">
              No confirmed paddlers yet.
            </p>
          </Card>
        )}
        {maybeParticipants.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-driftwood mb-2">Maybe ({maybeParticipants.length})</p>
            <div className="flex -space-x-2">
              {maybeParticipants.map((p) => (
                <div
                  key={p.id}
                  className="w-7 h-7 rounded-full border-2 border-salt-white bg-storm-grey/10 flex items-center justify-center overflow-hidden opacity-60"
                  title={p.user?.name || 'Paddler'}
                >
                  {p.user?.image ? (
                    <img
                      src={p.user.image}
                      alt={p.user.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-storm-grey">
                      {(p.user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {isOrganiser && (
          <AddParticipants
            paddleId={paddle.id}
            allUsers={allUsers}
            participantUserIds={participantUserIds}
          />
        )}
      </section>

      {/* Food Section (single-day planned/active paddles only) */}
      {!paddle.endDate && paddle.status !== 'completed' && (
        <>
          <WaveDividerSubtle />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-4 h-4 text-atlantic-blue" />
              <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
                Food
              </h2>
            </div>
            <FoodSection
              paddleId={paddle.id}
              isOrganiser={isOrganiser}
              participants={goingParticipants.map((p) => ({
                userId: p.userId,
                userName: p.user?.name || 'Unknown',
                userImage: p.user?.image || null,
              }))}
              initialAllocations={foodAllocations}
            />
          </section>
        </>
      )}

      {/* Shuttle Section */}
      {needsShuttle && (
        <>
          <WaveDividerSubtle />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-atlantic-blue" />
              <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
                Shuttle
              </h2>
            </div>
            <Card>
              <p className="text-sm text-storm-grey mb-3">
                This route has separate put-in and take-out points. Coordinate car shuttles below.
              </p>
              {shuttleOffers.length > 0 ? (
                <div className="space-y-2">
                  {shuttleOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between rounded-xl bg-sand p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sea-foam flex items-center justify-center overflow-hidden">
                          {offer.user?.image ? (
                            <img
                              src={offer.user.image}
                              alt={offer.user.name || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-atlantic-blue">
                              {(offer.user?.name || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-deep-ocean">
                            {offer.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-driftwood capitalize">
                            {offer.direction} &middot; {offer.seatsAvailable} seat{offer.seatsAvailable !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {offer.pickupLocationNotes && (
                        <span className="text-xs text-driftwood max-w-[120px] truncate">
                          {offer.pickupLocationNotes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-driftwood text-center py-3">
                  No shuttle offers yet. Share your car details with the group!
                </p>
              )}
            </Card>
          </section>
        </>
      )}

      <WaveDividerSubtle />

      {/* Comments */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4 text-atlantic-blue" />
          <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
            Comments ({comments.length})
          </h2>
        </div>
        {otherComments.length > 0 ? (
          <div className="space-y-3">
            {otherComments.map((comment) => (
              <Card key={comment.id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-sea-foam flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                    {comment.user?.image ? (
                      <img
                        src={comment.user.image}
                        alt={comment.user.name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-atlantic-blue">
                        {(comment.user?.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-deep-ocean">
                        {comment.user?.name || 'Unknown'}
                      </span>
                      {comment.commentType !== 'general' && (
                        <CommentTypeBadge type={comment.commentType} />
                      )}
                      <span className="text-xs text-driftwood">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-storm-grey">{comment.text}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="sm">
            <p className="text-sm text-driftwood text-center py-3">
              No comments yet. Be the first to share a thought!
            </p>
          </Card>
        )}

        <PaddleCommentForm paddleId={paddle.id} />
      </section>

      {/* Photos Gallery */}
      <WaveDividerSubtle />
      <section>
        <PaddlePhotos
          paddleId={paddle.id}
          initialPhotos={photos.map((p) => ({
            id: p.id,
            storage_url: p.storageUrl,
            thumbnail_url: p.thumbnailUrl,
            caption: p.caption,
            photo_type: p.photoType,
            created_at: p.createdAt.toISOString(),
            users: p.user ? { name: p.user.name || 'Unknown' } : null,
          }))}
        />
      </section>

      {/* Notes */}
      {paddle.notes && (
        <>
          <WaveDividerSubtle />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="w-4 h-4 text-atlantic-blue" />
              <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
                Notes
              </h2>
            </div>
            <Card padding="sm">
              <p className="text-sm text-storm-grey whitespace-pre-wrap">{paddle.notes}</p>
            </Card>
          </section>
        </>
      )}

      {/* Share */}
      <div className="pt-2 pb-4">
        <WhatsAppShare message={whatsappMessage} />
      </div>
    </div>
  )
}

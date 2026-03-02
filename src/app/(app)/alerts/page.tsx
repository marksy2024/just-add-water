import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatRelativeDate } from '@/lib/utils'
import { UserPlus, MessageCircle, Hand, Plus, Bell } from 'lucide-react'
import Link from 'next/link'

const typeIcons: Record<string, typeof Bell> = {
  added_to_paddle: UserPlus,
  comment: MessageCircle,
  rsvp: Hand,
  new_paddle: Plus,
}

const typeColors: Record<string, string> = {
  added_to_paddle: 'bg-atlantic-blue/10 text-atlantic-blue',
  comment: 'bg-kelp-green/10 text-kelp-green',
  rsvp: 'bg-sunset-coral/10 text-sunset-coral',
  new_paddle: 'bg-deep-ocean/10 text-deep-ocean',
}

export default async function AlertsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, image: true } },
    },
  })

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-storm-grey/10 flex items-center justify-center mb-4">
          <Bell className="w-6 h-6 text-storm-grey" />
        </div>
        <p className="text-driftwood font-medium">All caught up — no new alerts</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => {
        const Icon = typeIcons[n.type] ?? Bell
        const colorClass = typeColors[n.type] ?? 'bg-storm-grey/10 text-storm-grey'
        const actorInitial = (n.actor?.name ?? '?').charAt(0).toUpperCase()

        const content = (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-storm-grey/5 hover:border-storm-grey/15 transition-colors">
            {/* Actor avatar */}
            <div className="w-9 h-9 rounded-full bg-sea-foam flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-deep-ocean">{actorInitial}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-deep-ocean leading-snug">{n.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
                  <Icon className="w-3 h-3" />
                </span>
                <span className="text-xs text-driftwood">{formatRelativeDate(n.createdAt)}</span>
              </div>
            </div>
          </div>
        )

        if (n.paddleId) {
          return (
            <Link key={n.id} href={`/paddles/${n.paddleId}`} className="block">
              {content}
            </Link>
          )
        }

        return <div key={n.id}>{content}</div>
      })}
    </div>
  )
}

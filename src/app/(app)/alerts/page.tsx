import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AlertList from '@/components/alerts/AlertList'

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

  // Serialize dates for the client component
  const serialized = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    paddleId: n.paddleId,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor,
  }))

  return <AlertList notifications={serialized} />
}

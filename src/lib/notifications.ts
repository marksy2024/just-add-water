import { prisma } from '@/lib/db'

export function notify(
  userId: string,
  type: string,
  title: string,
  paddleId?: string,
  actorId?: string,
) {
  return prisma.notification.create({
    data: { userId, type, title, paddleId: paddleId ?? null, actorId: actorId ?? null },
  })
}

export function notifyMany(
  userIds: string[],
  type: string,
  title: string,
  paddleId?: string,
  actorId?: string,
) {
  // Filter out the actor so you don't notify yourself
  const recipients = actorId ? userIds.filter((id) => id !== actorId) : userIds
  if (recipients.length === 0) return Promise.resolve()

  return prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type,
      title,
      paddleId: paddleId ?? null,
      actorId: actorId ?? null,
    })),
  })
}

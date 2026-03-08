'use client'

import { useState } from 'react'
import { UserPlus, MessageCircle, Hand, Plus, Bell, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeDate } from '@/lib/utils'

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

export interface SerializedNotification {
  id: string
  type: string
  title: string
  paddleId: string | null
  createdAt: string
  actor: { id: string; name: string | null; image: string | null } | null
}

export default function AlertList({ notifications: initial }: { notifications: SerializedNotification[] }) {
  const [notifications, setNotifications] = useState(initial)

  async function deleteOne(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function deleteAll() {
    if (!confirm('Clear all alerts?')) return
    setNotifications([])
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
  }

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
      <div className="flex justify-end mb-2">
        <button
          onClick={deleteAll}
          className="text-xs font-medium text-sunset-coral hover:text-sunset-coral/80 transition-colors"
        >
          Clear all
        </button>
      </div>

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

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                deleteOne(n.id)
              }}
              className="p-1.5 rounded-lg text-storm-grey hover:text-sunset-coral hover:bg-sunset-coral/10 transition-colors shrink-0"
              aria-label="Delete alert"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Plus } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
}

interface AddParticipantsProps {
  paddleId: string
  allUsers: User[]
  participantUserIds: string[]
}

const AVATAR_COLOURS = [
  'bg-sea-foam text-atlantic-blue',
  'bg-sunset-coral/10 text-sunset-coral',
  'bg-atlantic-blue/10 text-atlantic-blue',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
]

function getAvatarColour(index: number) {
  return AVATAR_COLOURS[index % AVATAR_COLOURS.length]
}

export function AddParticipants({ paddleId, allUsers, participantUserIds }: AddParticipantsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)

  const availableUsers = allUsers.filter(
    (u) => !participantUserIds.includes(u.id)
  )

  const filtered = search.trim()
    ? availableUsers.filter(
        (u) =>
          (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : availableUsers

  const handleAdd = async (userId: string) => {
    setAdding(userId)
    try {
      const res = await fetch(`/api/paddles/${paddleId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch {
      // silently fail
    } finally {
      setAdding(null)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-atlantic-blue hover:text-deep-ocean transition-colors mt-3"
      >
        <UserPlus className="w-4 h-4" />
        Add paddlers
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-storm-grey/15 bg-salt-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-deep-ocean flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-atlantic-blue" />
          Add paddlers
        </span>
        <button
          onClick={() => { setOpen(false); setSearch('') }}
          className="text-xs text-driftwood hover:text-storm-grey"
        >
          Close
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-driftwood" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-storm-grey/20 text-sm bg-white"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-driftwood text-center py-2">
          {availableUsers.length === 0 ? 'All users are already paddlers' : 'No matching users'}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.slice(0, 20).map((user, i) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-storm-grey/5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${getAvatarColour(i)}`}
                >
                  <span className="text-xs font-semibold">
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-deep-ocean truncate">
                    {user.name || 'Unnamed'}
                  </p>
                  <p className="text-xs text-driftwood truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleAdd(user.id)}
                disabled={adding === user.id}
                className="shrink-0 w-7 h-7 rounded-full bg-atlantic-blue text-white flex items-center justify-center hover:bg-deep-ocean transition-colors disabled:opacity-50"
              >
                {adding === user.id ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

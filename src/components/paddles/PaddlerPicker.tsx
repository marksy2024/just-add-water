'use client'

import { useState } from 'react'
import { Search, X, UserPlus } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
}

interface PaddlerPickerProps {
  allUsers: User[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
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

export function PaddlerPicker({ allUsers, selectedIds, onChange }: PaddlerPickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selectedUsers = allUsers.filter((u) => selectedIds.includes(u.id))
  const availableUsers = allUsers.filter((u) => !selectedIds.includes(u.id))

  const filtered = search.trim()
    ? availableUsers.filter(
        (u) =>
          (u.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : availableUsers

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId))
    } else {
      onChange([...selectedIds, userId])
    }
  }

  const handleRemove = (userId: string) => {
    onChange(selectedIds.filter((id) => id !== userId))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-atlantic-blue hover:text-deep-ocean transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Add paddlers to this trip
        {selectedIds.length > 0 && (
          <span className="ml-1 text-xs bg-atlantic-blue text-white rounded-full px-1.5 py-0.5">
            {selectedIds.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-storm-grey/15 bg-salt-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-deep-ocean flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-atlantic-blue" />
          Add paddlers
        </span>
        <button
          type="button"
          onClick={() => { setOpen(false); setSearch('') }}
          className="text-xs text-driftwood hover:text-storm-grey"
        >
          Done
        </button>
      </div>

      {/* Selected chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 bg-atlantic-blue/10 text-atlantic-blue text-xs font-medium px-2 py-1 rounded-full"
            >
              {user.name || user.email}
              <button
                type="button"
                onClick={() => handleRemove(user.id)}
                className="hover:text-deep-ocean"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
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

      {/* User list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-driftwood text-center py-2">
          {availableUsers.length === 0 ? 'All users already added' : 'No matching users'}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.slice(0, 20).map((user, i) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleToggle(user.id)}
              className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-storm-grey/5 text-left"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${getAvatarColour(i)}`}
              >
                <span className="text-xs font-semibold">
                  {(user.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-deep-ocean truncate">
                  {user.name || 'Unnamed'}
                </p>
                <p className="text-xs text-driftwood truncate">{user.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'

interface MyParticipationActionsProps {
  paddleId: string
  participantId: string
  distanceKm: number | null
}

export function MyParticipationActions({
  paddleId,
  participantId,
  distanceKm,
}: MyParticipationActionsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [km, setKm] = useState(distanceKm != null ? String(distanceKm) : '')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const saveDistance = async () => {
    const value = parseFloat(km)
    if (isNaN(value) || value < 0) {
      setKm(distanceKm != null ? String(distanceKm) : '')
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/paddles/${paddleId}/my-participation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distanceKm: value }),
      })
      if (res.ok) {
        setEditing(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to update distance:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    try {
      const res = await fetch(`/api/paddles/${paddleId}/my-participation`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/profile')
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to remove participation:', err)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Editable distance */}
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            step="0.1"
            min="0"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            onBlur={saveDistance}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveDistance()
              if (e.key === 'Escape') {
                setKm(distanceKm != null ? String(distanceKm) : '')
                setEditing(false)
              }
            }}
            disabled={saving}
            autoFocus
            className="w-16 text-sm text-right rounded-lg border border-atlantic-blue/30 px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-atlantic-blue bg-white"
          />
          <span className="text-xs text-driftwood">km</span>
        </div>
      ) : (
        <button
          onClick={() => {
            setEditing(true)
            setTimeout(() => inputRef.current?.select(), 0)
          }}
          className="flex items-center gap-1 text-sm text-atlantic-blue hover:text-deep-ocean transition-colors cursor-pointer"
          title="Edit your distance"
        >
          <Pencil className="w-3 h-3" />
          <span className="stat-number">
            {distanceKm != null ? `${Number(distanceKm).toFixed(1)}km` : 'Add km'}
          </span>
        </button>
      )}

      {/* Remove from history */}
      {confirming ? (
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={handleRemove}
            disabled={removing}
            className="text-[10px] font-semibold text-white bg-sunset-coral rounded-lg px-2 py-0.5 hover:bg-sunset-coral/90 disabled:opacity-60 cursor-pointer"
          >
            {removing ? 'Removing...' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[10px] font-semibold text-driftwood hover:text-storm-grey cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-driftwood hover:text-sunset-coral transition-colors cursor-pointer"
          title="Remove from your history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

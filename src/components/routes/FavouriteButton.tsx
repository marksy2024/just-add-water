'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

interface FavouriteButtonProps {
  routeId: string
  initialFavourited: boolean
}

export function FavouriteButton({ routeId, initialFavourited }: FavouriteButtonProps) {
  const [favourited, setFavourited] = useState(initialFavourited)

  async function toggle() {
    setFavourited(!favourited)
    try {
      await fetch(`/api/routes/${routeId}/favourite`, { method: 'POST' })
    } catch {
      setFavourited(favourited) // revert
    }
  }

  return (
    <button
      onClick={toggle}
      className="shrink-0 p-1 -m-1 transition-colors"
      aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          favourited ? 'fill-sunset-coral text-sunset-coral' : 'text-storm-grey/30'
        }`}
      />
    </button>
  )
}

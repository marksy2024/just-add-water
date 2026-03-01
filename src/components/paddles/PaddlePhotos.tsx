'use client'

import { useState } from 'react'
import { PhotoGallery } from '@/components/photos/PhotoGallery'
import { PhotoUpload } from '@/components/photos/PhotoUpload'
import { Camera } from 'lucide-react'

interface Photo {
  id: string
  storage_url: string
  thumbnail_url?: string | null
  caption?: string | null
  photo_type: string
  created_at: string
  users?: { name: string } | null
}

interface PaddlePhotosProps {
  paddleId: string
  initialPhotos: Photo[]
}

export function PaddlePhotos({ paddleId, initialPhotos }: PaddlePhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  const handleUploaded = async () => {
    try {
      const res = await fetch(`/api/paddles/${paddleId}/photos`)
      if (!res.ok) return
      const data = await res.json()
      const mapped: Photo[] = data.photos.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        storage_url: p.storageUrl as string,
        thumbnail_url: (p.thumbnailUrl as string) || null,
        caption: (p.caption as string) || null,
        photo_type: p.photoType as string,
        created_at: p.createdAt as string,
        users: p.user ? { name: (p.user as { name: string }).name } : null,
      }))
      setPhotos(mapped)
    } catch {
      // silently fail — gallery still shows previous state
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-atlantic-blue" />
        <h2 className="text-sm font-semibold text-driftwood uppercase tracking-wide">
          Photos ({photos.length})
        </h2>
      </div>
      <PhotoGallery photos={photos} />
      <div className="mt-4">
        <PhotoUpload paddleId={paddleId} onUploaded={handleUploaded} />
      </div>
    </div>
  )
}

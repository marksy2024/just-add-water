'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  id: string
  storage_url: string
  thumbnail_url?: string | null
  caption?: string | null
  photo_type: string
  created_at: string
  users?: { name: string } | null
}

interface PhotoGalleryProps {
  photos: Photo[]
  showTypeFilter?: boolean
}

export function PhotoGallery({ photos, showTypeFilter = true }: PhotoGalleryProps) {
  const [selectedType, setSelectedType] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const types = ['all', ...new Set(photos.map((p) => p.photo_type))]
  const filtered = selectedType === 'all' ? photos : photos.filter((p) => p.photo_type === selectedType)

  return (
    <div>
      {showTypeFilter && types.length > 2 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-deep-ocean text-white'
                  : 'bg-storm-grey/10 text-storm-grey hover:bg-storm-grey/20'
              }`}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-driftwood text-center py-6">No photos yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square rounded-xl overflow-hidden bg-storm-grey/10 hover:opacity-90 transition-opacity"
            >
              <img
                src={photo.thumbnail_url || photo.storage_url}
                alt={photo.caption || 'Paddle photo'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {lightboxIndex < filtered.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={filtered[lightboxIndex].storage_url}
              alt={filtered[lightboxIndex].caption || 'Photo'}
              className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
            />
            {(filtered[lightboxIndex].caption || filtered[lightboxIndex].users) && (
              <div className="text-center mt-3">
                {filtered[lightboxIndex].caption && (
                  <p className="text-white text-sm">{filtered[lightboxIndex].caption}</p>
                )}
                {filtered[lightboxIndex].users && (
                  <p className="text-white/50 text-xs mt-1">by {filtered[lightboxIndex].users!.name}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

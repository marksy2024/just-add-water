'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'

const avatarColors = [
  'bg-deep-ocean',
  'bg-atlantic-blue',
  'bg-kelp-green',
  'bg-sunset-coral',
  'bg-amber-buoy',
  'bg-paddle-coastal',
  'bg-paddle-canal',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

interface ProfilePhotoUploadProps {
  currentImage: string | null
  userName: string
}

export function ProfilePhotoUpload({ currentImage, userName }: ProfilePhotoUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const initial = userName.charAt(0).toUpperCase()
  const colorClass = getAvatarColor(userName)
  const displayImage = preview || currentImage

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        router.refresh()
      }
    } catch {
      // Revert preview on failure
      setPreview(null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="relative w-16 h-16 shrink-0">
      <div
        className={`w-16 h-16 rounded-full ${displayImage ? '' : colorClass} flex items-center justify-center overflow-hidden`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={userName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-2xl">{initial}</span>
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-atlantic-blue text-white flex items-center justify-center shadow-md hover:bg-deep-ocean transition-colors disabled:opacity-50"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

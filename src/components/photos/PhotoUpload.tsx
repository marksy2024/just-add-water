'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PhotoUploadProps {
  paddleId?: string
  routeId?: string
  onUploaded?: () => void
}

export function PhotoUpload({ paddleId, routeId, onUploaded }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [photoType, setPhotoType] = useState('general')
  const inputRef = useRef<HTMLInputElement>(null)

  const typeOptions = paddleId
    ? ['general', 'put_in', 'take_out', 'hazard', 'scenic']
    : ['scenic', 'put_in', 'take_out', 'hazard', 'access', 'parking']

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)

    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      if (paddleId) fd.append('paddle_id', paddleId)
      if (routeId) fd.append('route_id', routeId)
      if (caption) fd.append('caption', caption)
      fd.append('photo_type', photoType)

      await fetch('/api/photos', { method: 'POST', body: fd })
    }

    setFiles([])
    setCaption('')
    setUploading(false)
    onUploaded?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-storm-grey/20 rounded-xl p-4 text-center hover:border-atlantic-blue/30 transition-colors"
        >
          <Upload className="w-6 h-6 mx-auto mb-1 text-driftwood" />
          <span className="text-sm text-driftwood">Choose photos</span>
        </button>
        <button
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute('capture', 'environment')
              inputRef.current.click()
              inputRef.current.removeAttribute('capture')
            }
          }}
          className="w-16 border-2 border-dashed border-storm-grey/20 rounded-xl flex items-center justify-center hover:border-atlantic-blue/30 transition-colors"
        >
          <Camera className="w-6 h-6 text-driftwood" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {files.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {files.map((file, i) => (
              <div key={i} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-storm-grey/10">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="flex-1 px-3 py-2 rounded-lg border border-storm-grey/20 text-sm"
            />
            <select
              value={photoType}
              onChange={(e) => setPhotoType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-storm-grey/20 text-sm bg-salt-white"
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleUpload} loading={uploading} size="sm" className="w-full">
            Upload {files.length} photo{files.length > 1 ? 's' : ''}
          </Button>
        </>
      )}
    </div>
  )
}

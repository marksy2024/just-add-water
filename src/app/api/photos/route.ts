import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { extractGpsFromBuffer } from '@/lib/exif'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_DIMENSION = 2000
const THUMB_DIMENSION = 400
const JPEG_QUALITY = 80

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const paddleId = formData.get('paddle_id') as string | null
  const routeId = formData.get('route_id') as string | null
  const caption = formData.get('caption') as string | null
  const photoType = (formData.get('photo_type') as string) || 'general'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!paddleId && !routeId) {
    return NextResponse.json({ error: 'paddle_id or route_id required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Extract GPS coordinates from EXIF data
  const gps = await extractGpsFromBuffer(buffer)

  // Generate unique filename
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const thumbFileName = `thumb-${fileName}`

  // Determine directory structure
  const subDir = paddleId
    ? path.join('photos', 'paddles', paddleId)
    : path.join('photos', 'routes', routeId!)

  const fullDir = path.join(UPLOAD_DIR, subDir)
  await mkdir(fullDir, { recursive: true })

  // Resize original (max 2000px longest edge, 80% JPEG quality)
  const resized = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()

  // Generate thumbnail (400px longest edge)
  const thumbnail = await sharp(buffer)
    .resize(THUMB_DIMENSION, THUMB_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()

  // Write files to disk
  const filePath = path.join(fullDir, fileName)
  const thumbPath = path.join(fullDir, thumbFileName)
  await writeFile(filePath, resized)
  await writeFile(thumbPath, thumbnail)

  // URLs served by Nginx at /uploads/
  const storageUrl = `/uploads/${subDir}/${fileName}`
  const thumbnailUrl = `/uploads/${subDir}/${thumbFileName}`

  try {
    // Insert record into the appropriate table
    if (paddleId) {
      const data = await prisma.paddlePhoto.create({
        data: {
          paddleId,
          userId: session.user.id,
          storageUrl,
          thumbnailUrl,
          caption,
          photoType,
          locationLat: gps?.lat ?? null,
          locationLng: gps?.lng ?? null,
        },
      })

      return NextResponse.json(data)
    } else {
      const data = await prisma.routePhoto.create({
        data: {
          routeId: routeId!,
          userId: session.user.id,
          storageUrl,
          thumbnailUrl,
          caption,
          photoType,
          locationLat: gps?.lat ?? null,
          locationLng: gps?.lng ?? null,
        },
      })

      return NextResponse.json(data)
    }
  } catch (err) {
    console.error('Photo DB insert error:', err)
    return NextResponse.json(
      { error: 'Failed to save photo record' },
      { status: 500 }
    )
  }
}

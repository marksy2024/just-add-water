import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const AVATAR_SIZE = 512
const THUMB_SIZE = 128
const JPEG_QUALITY = 80

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const avatarDir = path.join(UPLOAD_DIR, 'avatars')
  await mkdir(avatarDir, { recursive: true })

  const fileName = `${userId}.jpg`
  const thumbFileName = `thumb-${userId}.jpg`

  // Resize to 512x512 square (cover/crop)
  const avatar = await sharp(buffer)
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()

  // Generate 128x128 thumbnail
  const thumbnail = await sharp(buffer)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer()

  await writeFile(path.join(avatarDir, fileName), avatar)
  await writeFile(path.join(avatarDir, thumbFileName), thumbnail)

  // Cache-bust with timestamp
  const storageUrl = `/uploads/avatars/${fileName}?t=${Date.now()}`

  await prisma.user.update({
    where: { id: userId },
    data: { image: storageUrl },
  })

  return NextResponse.json({ image: storageUrl })
}

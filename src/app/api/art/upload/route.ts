import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { moderateContent } from '@/lib/moderation'

const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760') // 10MB default
const ALLOWED_TYPES = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',')
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string || ''
    const tags = formData.get('tags') as string || ''
    const nsfw = formData.get('nsfw') === 'true'

    if (!file || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Moderate content if description provided
    if (description && process.env.ENABLE_MODERATION_API === 'true') {
      const moderation = await moderateContent(description)
      if (moderation.flagged) {
        return NextResponse.json({ 
          error: 'Content violates community guidelines',
          category: moderation.category 
        }, { status: 400 })
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const userDir = join(UPLOAD_DIR, session.user.id)
    const filepath = join(userDir, filename)
    const thumbnailFilename = `thumb_${filename}`
    const thumbnailPath = join(userDir, thumbnailFilename)

    // Create user directory if it doesn't exist
    await mkdir(userDir, { recursive: true })

    // Save original file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Process image and create thumbnail
    let width: number | undefined
    let height: number | undefined

    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      width = metadata.width
      height = metadata.height

      // Create thumbnail (max 400x400)
      await image
        .resize(400, 400, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toFile(thumbnailPath)
    } catch (error) {
      console.error('Error processing image:', error)
    }

    // Parse and create tags
    const tagNames = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    const tagRecords = await Promise.all(
      tagNames.map(name =>
        prisma.tag.upsert({
          where: { name },
          create: { name },
          update: {},
        })
      )
    )

    // Create artwork record
    const artwork = await prisma.artwork.create({
      data: {
        userId: session.user.id,
        title,
        description,
        filename,
        fileUrl: `/uploads/${session.user.id}/${filename}`,
        thumbnailUrl: `/uploads/${session.user.id}/${thumbnailFilename}`,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
        nsfw,
        tags: {
          connect: tagRecords.map(tag => ({ id: tag.id })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        tags: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      artwork: {
        ...artwork,
        liked: false, // User just uploaded it
      },
    })
  } catch (error) {
    console.error('Error uploading artwork:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Route segment config for App Router
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout for file uploads 
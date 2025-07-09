import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has moderation permissions
    const userRoles = await prisma.userDiscordRole.findMany({
      where: { userId: session.user.id },
      include: { role: true },
    })

    const hasModPerms = userRoles.some(ur => {
      // Check for common mod permission bits
      const perms = BigInt(ur.role.permissions)
      const MANAGE_MESSAGES = BigInt(1 << 13)
      const MODERATE_MEMBERS = BigInt(1 << 40)
      return (perms & MANAGE_MESSAGES) === MANAGE_MESSAGES || 
             (perms & MODERATE_MEMBERS) === MODERATE_MEMBERS
    })

    if (!hasModPerms) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const resolved = searchParams.get('resolved') === 'true'
    const flagType = searchParams.get('flagType') as any

    // Build query
    const where: any = { resolved }
    if (flagType) {
      where.flagType = flagType
    }

    // Get flagged content
    const [flags, total] = await Promise.all([
      prisma.moderationFlag.findMany({
        where,
        include: {
          artwork: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.moderationFlag.count({ where }),
    ])

    return NextResponse.json({
      flags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check mod permissions (same as GET)
    const userRoles = await prisma.userDiscordRole.findMany({
      where: { userId: session.user.id },
      include: { role: true },
    })

    const hasModPerms = userRoles.some(ur => {
      const perms = BigInt(ur.role.permissions)
      const MANAGE_MESSAGES = BigInt(1 << 13)
      const MODERATE_MEMBERS = BigInt(1 << 40)
      return (perms & MANAGE_MESSAGES) === MANAGE_MESSAGES || 
             (perms & MODERATE_MEMBERS) === MODERATE_MEMBERS
    })

    if (!hasModPerms) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { flagId, action } = await request.json()

    if (!flagId || !['resolve', 'dismiss', 'escalate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const flag = await prisma.moderationFlag.findUnique({
      where: { id: flagId },
      include: { artwork: true },
    })

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    switch (action) {
      case 'resolve':
        // Mark as resolved and take action on the content
        await prisma.moderationFlag.update({
          where: { id: flagId },
          data: {
            resolved: true,
            resolvedBy: session.user.id,
            resolvedAt: new Date(),
          },
        })

        // If artwork, unpublish it
        if (flag.artworkId) {
          await prisma.artwork.update({
            where: { id: flag.artworkId },
            data: { published: false },
          })
        }
        break;

      case 'dismiss':
        // Mark as resolved but don't take action
        await prisma.moderationFlag.update({
          where: { id: flagId },
          data: {
            resolved: true,
            resolvedBy: session.user.id,
            resolvedAt: new Date(),
          },
        })
        break;

      case 'escalate':
        // Could implement escalation to admins
        // For now, just add a note
        await prisma.moderationFlag.update({
          where: { id: flagId },
          data: {
            apiResponse: {
              ...(flag.apiResponse as any),
              escalated: true,
              escalatedBy: session.user.id,
              escalatedAt: new Date(),
            },
          },
        })
        break;
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Error processing moderation action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
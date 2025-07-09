import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication check
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const guildId = process.env.DISCORD_GUILD_ID
    if (!guildId) {
      return NextResponse.json({ error: 'Guild ID not configured' }, { status: 500 })
    }
    
    // Get current stats
    const guild = await prisma.discordGuild.findUnique({
      where: { id: guildId },
      include: {
        stats: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })
    
    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
    }
    
    // Get historical stats for the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const historicalStats = await prisma.guildStats.findMany({
      where: {
        guildId,
        timestamp: { gte: oneDayAgo },
      },
      orderBy: { timestamp: 'asc' },
    })
    
    // Calculate averages
    const avgOnline = historicalStats.reduce((sum, stat) => sum + stat.onlineCount, 0) / historicalStats.length || 0
    const totalMessages = historicalStats.reduce((sum, stat) => sum + stat.messageCount, 0)
    
    // Get moderation stats
    const moderationStats = await prisma.moderationLog.groupBy({
      by: ['action'],
      where: {
        guildId,
        createdAt: { gte: oneDayAgo },
      },
      _count: true,
    })
    
    const response = {
      current: {
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        onlineCount: guild.onlineCount,
        messagesPerMinute: guild.messagesPerMin,
      },
      stats: {
        averageOnline: Math.round(avgOnline),
        totalMessages24h: totalMessages,
        peakOnline: Math.max(...historicalStats.map(s => s.onlineCount), 0),
      },
      moderation: {
        last24h: moderationStats.reduce((acc, stat) => {
          acc[stat.action.toLowerCase()] = stat._count
          return acc
        }, {} as Record<string, number>),
      },
      history: historicalStats.map(stat => ({
        timestamp: stat.timestamp,
        memberCount: stat.memberCount,
        onlineCount: stat.onlineCount,
        messageCount: stat.messageCount,
      })),
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, max-age=60',
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
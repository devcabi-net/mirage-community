import { Client, Guild } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from './logger'

let messageCount = 0
let messageCountTimer: NodeJS.Timeout | null = null

export function startGuildMonitoring(client: Client, guildId: string) {
  const guild = client.guilds.cache.get(guildId)
  if (!guild) {
    logger.error(`Guild ${guildId} not found`)
    return
  }

  // Update stats every 5 minutes
  setInterval(async () => {
    await updateGuildStats(guild)
  }, 5 * 60 * 1000)

  // Initial update
  updateGuildStats(guild)

  // Start message counting
  startMessageCounting(guild)
}

async function updateGuildStats(guild: Guild) {
  try {
    const onlineCount = guild.members.cache.filter(member => 
      member.presence?.status !== 'offline'
    ).size

    const messagesPerMin = messageCount / 5 // Messages in last 5 minutes
    messageCount = 0 // Reset counter

    await prisma.discordGuild.update({
      where: { id: guild.id },
      data: {
        memberCount: guild.memberCount,
        onlineCount,
        messagesPerMin,
      },
    })

    // Store historical stats
    await prisma.guildStats.create({
      data: {
        guildId: guild.id,
        memberCount: guild.memberCount,
        onlineCount,
        messageCount: Math.round(messagesPerMin * 5),
      },
    })

    logger.info(`Updated stats for guild ${guild.name}: ${guild.memberCount} members, ${onlineCount} online, ${messagesPerMin.toFixed(2)} msg/min`)
  } catch (error) {
    logger.error('Error updating guild stats:', error)
  }
}

function startMessageCounting(guild: Guild) {
  guild.client.on('messageCreate', (message) => {
    if (message.guild?.id === guild.id && !message.author.bot) {
      messageCount++
    }
  })
}

export async function getGuildStats(guildId: string) {
  const stats = await prisma.discordGuild.findUnique({
    where: { id: guildId },
    include: {
      stats: {
        orderBy: { timestamp: 'desc' },
        take: 288, // Last 24 hours of 5-minute intervals
      },
    },
  })

  return stats
} 
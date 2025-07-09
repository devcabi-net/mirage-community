import { Events, Message } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from '../utils/logger'
import { moderateContent } from '../../src/lib/moderation'
import type { Event } from '../types'

const event: Event = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignore messages from bots
    if (message.author.bot) return
    
    // Ignore DMs
    if (!message.guild) return
    
    // Only moderate in the configured guild
    if (message.guild.id !== process.env.DISCORD_GUILD_ID) return
    
    try {
      // Check if moderation is enabled
      if (process.env.ENABLE_MODERATION_API !== 'true') return
      
      // Skip moderation for staff (you might want to add role checks here)
      const member = message.member
      if (member?.permissions.has('ManageMessages')) return
      
      // Moderate the content
      const moderation = await moderateContent(message.content)
      
      if (moderation.flagged) {
        // Delete the message
        await message.delete()
        
        // Create moderation flag in database
        await prisma.moderationFlag.create({
          data: {
            messageId: message.id,
            content: message.content,
            flagType: moderation.category,
            severity: moderation.severity,
            apiResponse: moderation.raw,
          },
        })
        
        // Send warning to user
        try {
          await message.author.send({
            embeds: [{
              color: 0xFF0000,
              title: 'Message Removed',
              description: `Your message in **${message.guild.name}** was automatically removed for violating community guidelines.`,
              fields: [
                {
                  name: 'Reason',
                  value: `${moderation.category} content detected`,
                },
                {
                  name: 'Message',
                  value: message.content.length > 1024 
                    ? message.content.substring(0, 1021) + '...' 
                    : message.content,
                },
                {
                  name: 'Note',
                  value: 'If you believe this was a mistake, please contact a moderator.',
                },
              ],
              timestamp: new Date().toISOString(),
            }],
          })
        } catch (error) {
          logger.warn(`Could not DM user ${message.author.tag}`)
        }
        
        // Log to moderation channel if configured
        const logChannel = message.guild.channels.cache.find(
          channel => channel.name === 'mod-logs' && channel.isTextBased()
        )
        
        if (logChannel && logChannel.isTextBased()) {
          await logChannel.send({
            embeds: [{
              color: 0xFF0000,
              title: 'Auto-Moderation: Message Removed',
              fields: [
                {
                  name: 'User',
                  value: `${message.author.tag} (${message.author.id})`,
                  inline: true,
                },
                {
                  name: 'Channel',
                  value: `<#${message.channel.id}>`,
                  inline: true,
                },
                {
                  name: 'Reason',
                  value: moderation.category,
                  inline: true,
                },
                {
                  name: 'Severity',
                  value: `${(moderation.severity * 100).toFixed(0)}%`,
                  inline: true,
                },
                {
                  name: 'Content',
                  value: message.content.length > 1024 
                    ? message.content.substring(0, 1021) + '...' 
                    : message.content,
                },
              ],
              timestamp: new Date().toISOString(),
            }],
          })
        }
        
        logger.info(`Auto-moderated message from ${message.author.tag} in ${message.guild.name}: ${moderation.category}`)
      }
    } catch (error) {
      logger.error('Error in message moderation:', error)
    }
  },
}

export default event 
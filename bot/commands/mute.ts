import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from '../utils/logger'
import type { Command } from '../types'

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to mute')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10080) // 7 days max
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const target = interaction.options.getMember('user')
    const targetUser = interaction.options.getUser('user', true)
    const duration = interaction.options.getInteger('duration') || 60 // Default 1 hour
    const reason = interaction.options.getString('reason') || 'No reason provided'
    
    if (!target || typeof target === 'string') {
      await interaction.reply({
        content: 'User not found in this server!',
        ephemeral: true,
      })
      return
    }
    
    // Cast to GuildMember since we've checked it's not null or string
    const member = target as GuildMember
    
    if (targetUser.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot mute yourself!',
        ephemeral: true,
      })
      return
    }
    
    if (member.user.bot) {
      await interaction.reply({
        content: 'You cannot mute bots!',
        ephemeral: true,
      })
      return
    }
    
    if (!member.moderatable) {
      await interaction.reply({
        content: 'I cannot mute this user! They may have higher permissions than me.',
        ephemeral: true,
      })
      return
    }
    
    try {
      const durationMs = duration * 60 * 1000
      const expiresAt = new Date(Date.now() + durationMs)
      
      // Apply timeout
      await member.timeout(durationMs, reason)
      
      // Create moderation log in database
      await prisma.moderationLog.create({
        data: {
          guildId: interaction.guildId!,
          userId: member.id,
          moderatorId: interaction.user.id,
          action: 'MUTE',
          reason,
          duration: duration * 60, // Store in seconds
          expiresAt,
        },
      })
      
      // Try to DM the user
      try {
        await member.send({
          embeds: [{
            color: 0xFF6B6B,
            title: 'You have been muted',
            description: `You have been muted in **${interaction.guild!.name}**`,
            fields: [
              {
                name: 'Duration',
                value: `${duration} minutes`,
                inline: true,
              },
              {
                name: 'Expires',
                value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
                inline: true,
              },
              {
                name: 'Reason',
                value: reason,
              },
              {
                name: 'Moderator',
                value: interaction.user.tag,
              },
            ],
            timestamp: new Date().toISOString(),
          }],
        })
      } catch (error) {
        logger.warn(`Could not DM user ${member.user.tag}`)
      }
      
      // Reply to interaction
      await interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: 'User Muted',
          description: `Successfully muted ${member.user.tag}`,
          fields: [
            {
              name: 'User',
              value: `${member.user.tag} (${member.id})`,
              inline: true,
            },
            {
              name: 'Duration',
              value: `${duration} minutes`,
              inline: true,
            },
            {
              name: 'Expires',
              value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
              inline: true,
            },
            {
              name: 'Moderator',
              value: `${interaction.user.tag}`,
              inline: true,
            },
            {
              name: 'Reason',
              value: reason,
            },
          ],
          timestamp: new Date().toISOString(),
        }],
      })
      
      logger.info(`${interaction.user.tag} muted ${member.user.tag} for ${duration} minutes in ${interaction.guild!.name} for: ${reason}`)
    } catch (error) {
      logger.error('Error executing mute command:', error)
      await interaction.reply({
        content: 'An error occurred while executing the command.',
        ephemeral: true,
      })
      return
    }
  },
}

export default command 
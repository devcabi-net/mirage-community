import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from '../utils/logger'
import type { Command } from '../types'

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  async execute(interaction) {
    const target = interaction.options.getMember('user')
    const targetUser = interaction.options.getUser('user', true)
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
        content: 'You cannot kick yourself!',
        ephemeral: true,
      })
      return
    }
    
    if (member.user.bot) {
      await interaction.reply({
        content: 'You cannot kick bots through this command!',
        ephemeral: true,
      })
      return
    }
    
    if (!member.kickable) {
      await interaction.reply({
        content: 'I cannot kick this user! They may have higher permissions than me.',
        ephemeral: true,
      })
      return
    }
    
    try {
      // Try to DM the user before kicking
      try {
        await member.send({
          embeds: [{
            color: 0xFF0000,
            title: 'You have been kicked',
            description: `You have been kicked from **${interaction.guild!.name}**`,
            fields: [
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
      
      // Kick the user
      await member.kick(reason)
      
      // Create moderation log in database
      await prisma.moderationLog.create({
        data: {
          guildId: interaction.guildId!,
          userId: member.id,
          moderatorId: interaction.user.id,
          action: 'KICK',
          reason,
        },
      })
      
      // Reply to interaction
      await interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: 'User Kicked',
          description: `Successfully kicked ${member.user.tag}`,
          fields: [
            {
              name: 'User',
              value: `${member.user.tag} (${member.id})`,
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
      
      logger.info(`${interaction.user.tag} kicked ${member.user.tag} from ${interaction.guild!.name} for: ${reason}`)
    } catch (error) {
      logger.error('Error executing kick command:', error)
      await interaction.reply({
        content: 'An error occurred while executing the command.',
        ephemeral: true,
      })
      return
    }
  },
}

export default command 
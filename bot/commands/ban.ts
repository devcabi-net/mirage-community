import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from '../utils/logger'
import type { Command } from '../types'

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  
  async execute(interaction) {
    const target = interaction.options.getUser('user', true)
    const reason = interaction.options.getString('reason') || 'No reason provided'
    const deleteDays = interaction.options.getInteger('delete_days') || 0
    
    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot ban yourself!',
        ephemeral: true,
      })
      return
      return
    }
    
    if (target.bot) {
      await interaction.reply({
        content: 'You cannot ban bots through this command!',
        ephemeral: true,
      })
      return
      return
    }
    
    // Check if user is in the guild
    const member = await interaction.guild!.members.fetch(target.id).catch(() => null)
    
    if (member && !member.bannable) {
      await interaction.reply({
        content: 'I cannot ban this user! They may have higher permissions than me.',
        ephemeral: true,
      })
      return
      return
    }
    
    try {
      // Try to DM the user before banning (if they're in the server)
      if (member) {
        try {
          await target.send({
            embeds: [{
              color: 0x8B0000,
              title: 'You have been banned',
              description: `You have been banned from **${interaction.guild!.name}**`,
              fields: [
                {
                  name: 'Reason',
                  value: reason,
                },
                {
                  name: 'Moderator',
                  value: interaction.user.tag,
                },
                {
                  name: 'Appeal',
                  value: 'If you believe this ban was made in error, you can appeal through our website.',
                },
              ],
              timestamp: new Date().toISOString(),
            }],
          })
        } catch (error) {
          logger.warn(`Could not DM user ${target.tag}`)
        }
      }
      
      // Ban the user
      await interaction.guild!.members.ban(target.id, {
        reason: `${reason} (by ${interaction.user.tag})`,
        deleteMessageDays: deleteDays as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
      })
      
      // Create moderation log in database
      await prisma.moderationLog.create({
        data: {
          guildId: interaction.guildId!,
          userId: target.id,
          moderatorId: interaction.user.id,
          action: 'BAN',
          reason,
        },
      })
      
      // Reply to interaction
      await interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: 'User Banned',
          description: `Successfully banned ${target.tag}`,
          fields: [
            {
              name: 'User',
              value: `${target.tag} (${target.id})
      return`,
              inline: true,
            },
            {
              name: 'Moderator',
              value: `${interaction.user.tag}`,
              inline: true,
            },
            {
              name: 'Messages Deleted',
              value: deleteDays > 0 ? `${deleteDays} days` : 'None',
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
      
      logger.info(`${interaction.user.tag} banned ${target.tag} from ${interaction.guild!.name} for: ${reason}`)
    } catch (error) {
      logger.error('Error executing ban command:', error)
      await interaction.reply({
        content: 'An error occurred while executing the command.',
        ephemeral: true,
      })
      return
    }
  },
}

export default command 
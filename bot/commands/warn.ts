import { SlashCommandBuilder, PermissionFlagsBits, GuildMember } from 'discord.js'
import { prisma } from '../../src/lib/prisma'
import { logger } from '../utils/logger'
import type { Command } from '../types'

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The reason for the warning')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    const target = interaction.options.getUser('user', true)
    const reason = interaction.options.getString('reason') || 'No reason provided'
    
    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot warn yourself!',
        ephemeral: true,
      })
      return
    }
    
    if (target.bot) {
      await interaction.reply({
        content: 'You cannot warn bots!',
        ephemeral: true,
      })
      return
    }
    
    try {
      // Create moderation log in database
      await prisma.moderationLog.create({
        data: {
          guildId: interaction.guildId!,
          userId: target.id,
          moderatorId: interaction.user.id,
          action: 'WARN',
          reason,
        },
      })
      
      // Try to DM the user
      try {
        await target.send({
          embeds: [{
            color: 0xFFFF00,
            title: 'Warning',
            description: `You have been warned in **${interaction.guild!.name}**`,
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
        logger.warn(`Could not DM user ${target.tag}`)
      }
      
      // Reply to interaction
      await interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: 'User Warned',
          description: `Successfully warned ${target.tag}`,
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
              name: 'Reason',
              value: reason,
            },
          ],
          timestamp: new Date().toISOString(),
        }],
      })
      
      logger.info(`${interaction.user.tag} warned ${target.tag} in ${interaction.guild!.name} for: ${reason}`)
    } catch (error) {
      logger.error('Error executing warn command:', error)
      await interaction.reply({
        content: 'An error occurred while executing the command.',
        ephemeral: true,
      })
      return
    }
  },
}

export default command 
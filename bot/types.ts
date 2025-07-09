import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder 
} from 'discord.js'

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface Event {
  name: string
  once?: boolean
  execute: (...args: any[]) => void | Promise<void>
} 
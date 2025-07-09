import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'
import { logger } from './utils/logger'
import { prisma } from '../src/lib/prisma'
import { startGuildMonitoring } from './utils/monitoring'
import type { Command } from './types'

dotenv.config()

// Extend Discord.js Client
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>
  }
}

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
})

client.commands = new Collection()

// Load commands
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const command = require(filePath).default
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
  } else {
    logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
  }
}

// Load events
const eventsPath = join(__dirname, 'events')
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'))

for (const file of eventFiles) {
  const filePath = join(eventsPath, file)
  const event = require(filePath).default
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args))
  } else {
    client.on(event.name, (...args) => event.execute(...args))
  }
}

// Register slash commands
async function registerCommands() {
  try {
    const commands = []
    for (const command of client.commands.values()) {
      commands.push(command.data.toJSON())
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!)
    
    logger.info(`Started refreshing ${commands.length} application (/) commands.`)
    
    const data = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_BOT_CLIENT_ID!,
        process.env.DISCORD_GUILD_ID!
      ),
      { body: commands }
    ) as any[]
    
    logger.info(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    logger.error('Error registering commands:', error)
  }
}

// Bot ready event
client.once('ready', async () => {
  if (!client.user) return
  
  logger.info(`Bot logged in as ${client.user.tag}!`)
  
  // Register commands
  await registerCommands()
  
  // Initialize guild in database
  const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!)
  if (guild) {
    await prisma.discordGuild.upsert({
      where: { id: guild.id },
      create: {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
      },
      update: {
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
      },
    })
    
    // Start monitoring
    startGuildMonitoring(client, guild.id)
  }
})

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error)
})

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error)
})

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN)
  .catch((error) => {
    logger.error('Failed to login:', error)
    process.exit(1)
  })

export default client 
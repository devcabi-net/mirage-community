import { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds guilds.members.read',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'discord' && profile) {
        try {
          // Cast profile to Discord profile type
          const discordProfile = profile as any
          
          // Update user with Discord data
          await prisma.user.update({
            where: { id: user.id },
            data: {
              discordId: discordProfile.id as string,
              username: discordProfile.username as string,
              discriminator: discordProfile.discriminator as string,
              avatar: discordProfile.avatar as string,
              banner: discordProfile.banner as string | undefined,
              accentColor: discordProfile.accent_color as number | undefined,
              locale: discordProfile.locale as string | undefined,
              verified: discordProfile.verified as boolean | undefined,
            },
          })

          // Fetch and store user's Discord roles for the main guild
          if (process.env.DISCORD_GUILD_ID && account.access_token) {
            await fetchAndStoreUserRoles(user.id, account.access_token)
          }
        } catch (error) {
          console.error('Error updating user Discord data:', error)
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Fetch additional user data
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            discordRoles: {
              include: {
                role: true,
              },
            },
            sftpAccess: true,
          },
        })
        
        if (userData) {
          session.user.discordId = userData.discordId
          session.user.username = userData.username
          session.user.discriminator = userData.discriminator
          session.user.avatar = userData.avatar
          session.user.roles = userData.discordRoles.map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            color: ur.role.color,
          }))
          session.user.hasSftpAccess = !!userData.sftpAccess?.enabled
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

async function fetchAndStoreUserRoles(userId: string, accessToken: string) {
  try {
    const guildId = process.env.DISCORD_GUILD_ID!
    const response = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    
    if (!response.ok) {
      console.error('Failed to fetch guild member data:', response.statusText)
      return
    }
    
    const memberData = await response.json()
    const roleIds = memberData.roles as string[]
    
    // Clear existing roles for this user
    await prisma.userDiscordRole.deleteMany({
      where: {
        userId,
        guildId,
      },
    })
    
    // Add new roles
    if (roleIds.length > 0) {
      await prisma.userDiscordRole.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          guildId,
        })),
        skipDuplicates: true,
      })
    }
  } catch (error) {
    console.error('Error fetching user roles:', error)
  }
} 
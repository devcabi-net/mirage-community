import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      discordId: string
      username: string
      discriminator: string
      avatar?: string | null
      roles: {
        id: string
        name: string
        color: number
      }[]
      hasSftpAccess: boolean
    } & DefaultSession['user']
  }
  
  interface User extends DefaultUser {
    discordId: string
    username: string
    discriminator: string
    avatar?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    userId: string
  }
} 
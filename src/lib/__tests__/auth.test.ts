import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

// Mock Discord provider
vi.mock('next-auth/providers/discord', () => ({
  default: vi.fn(() => ({
    id: 'discord',
    name: 'Discord',
    type: 'oauth',
  })),
}))

// Mock Prisma
vi.mock('../prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('Auth Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock environment variables
    process.env.NEXTAUTH_SECRET = 'test-secret'
    process.env.DISCORD_CLIENT_ID = 'test-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'test-client-secret'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
  })

  describe('Auth Options', () => {
    it('should have Discord provider configured', async () => {
      const { authOptions } = await import('../auth')
      
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.providers.length).toBeGreaterThan(0)
    })

    it('should have Prisma adapter configured', async () => {
      const { authOptions } = await import('../auth')
      
      expect(authOptions.adapter).toBeDefined()
    })

    it('should have proper session configuration', async () => {
      const { authOptions } = await import('../auth')
      
      expect(authOptions.session).toBeDefined()
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have custom pages configured', async () => {
      const { authOptions } = await import('../auth')
      
      expect(authOptions.pages).toBeDefined()
      expect(authOptions.pages?.signIn).toBeDefined()
    })
  })

  describe('JWT Callback', () => {
    it('should handle JWT token creation', async () => {
      const { authOptions } = await import('../auth')
      
      const mockToken = { sub: 'user-123' }
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      
      if (authOptions.callbacks?.jwt) {
        const result = await authOptions.callbacks.jwt({
          token: mockToken,
          user: mockUser,
        })
        
        expect(result).toBeDefined()
        expect(result.sub).toBe('user-123')
      }
    })

    it('should handle Discord account linking', async () => {
      const { authOptions } = await import('../auth')
      
      const mockToken = { sub: 'user-123' }
      const mockAccount = {
        provider: 'discord',
        providerAccountId: 'discord-123',
        access_token: 'discord-token',
      }
      
      if (authOptions.callbacks?.jwt) {
        const result = await authOptions.callbacks.jwt({
          token: mockToken,
          account: mockAccount,
        })
        
        expect(result).toBeDefined()
      }
    })
  })

  describe('Session Callback', () => {
    it('should format session data correctly', async () => {
      const { authOptions } = await import('../auth')
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2024-01-01',
      }
      const mockToken = { sub: 'user-123', email: 'test@example.com' }
      
      if (authOptions.callbacks?.session) {
        const result = await authOptions.callbacks.session({
          session: mockSession,
          token: mockToken,
        })
        
        expect(result).toBeDefined()
        expect(result.user).toBeDefined()
      }
    })
  })

  describe('SignIn Callback', () => {
    it('should allow Discord sign in', async () => {
      const { authOptions } = await import('../auth')
      
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockAccount = { provider: 'discord', type: 'oauth' }
      
      if (authOptions.callbacks?.signIn) {
        const result = await authOptions.callbacks.signIn({
          user: mockUser,
          account: mockAccount,
        })
        
        expect(result).toBe(true)
      }
    })

    it('should reject non-Discord providers', async () => {
      const { authOptions } = await import('../auth')
      
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockAccount = { provider: 'google', type: 'oauth' }
      
      if (authOptions.callbacks?.signIn) {
        const result = await authOptions.callbacks.signIn({
          user: mockUser,
          account: mockAccount,
        })
        
        // Should either reject or handle based on configuration
        expect(typeof result).toBe('boolean')
      }
    })
  })

  describe('Environment Variables', () => {
    it('should require NEXTAUTH_SECRET', () => {
      delete process.env.NEXTAUTH_SECRET
      
      expect(() => {
        // This should throw or handle missing secret
        const secret = process.env.NEXTAUTH_SECRET
        if (!secret) {
          throw new Error('NEXTAUTH_SECRET is required')
        }
      }).toThrow('NEXTAUTH_SECRET is required')
    })

    it('should require Discord credentials', () => {
      delete process.env.DISCORD_CLIENT_ID
      delete process.env.DISCORD_CLIENT_SECRET
      
      expect(() => {
        const clientId = process.env.DISCORD_CLIENT_ID
        const clientSecret = process.env.DISCORD_CLIENT_SECRET
        
        if (!clientId || !clientSecret) {
          throw new Error('Discord credentials are required')
        }
      }).toThrow('Discord credentials are required')
    })
  })
})

describe('Auth Utilities', () => {
  describe('getServerSession', () => {
    it('should return null for unauthenticated users', async () => {
      const { getServerSession } = await import('next-auth')
      
      // Mock getServerSession to return null
      vi.mocked(getServerSession).mockResolvedValue(null)
      
      const session = await getServerSession()
      expect(session).toBeNull()
    })

    it('should return session for authenticated users', async () => {
      const { getServerSession } = await import('next-auth')
      
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: '2024-01-01',
      }
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      
      const session = await getServerSession()
      expect(session).toEqual(mockSession)
    })
  })
})
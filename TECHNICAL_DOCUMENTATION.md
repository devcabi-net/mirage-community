# Technical Documentation: Mirage Community Platform

## Overview

The Mirage Community Platform is a full-stack TypeScript application built with Next.js 15 RC, featuring Discord integration, art gallery, moderation system, and SFTP access. This document provides detailed technical information about the actual implementation.

## Architecture

### Tech Stack

**Frontend:**
- Next.js 15.0.0-rc.1 with App Router
- React 19.0.0-rc
- TypeScript 5.5.3
- Tailwind CSS 3.4.4
- Radix UI components
- Framer Motion for animations
- Three.js with React Three Fiber

**Backend:**
- PostgreSQL 15 with Prisma ORM
- NextAuth.js for authentication
- Sharp for image processing
- Winston for logging
- Zod for validation

**External APIs:**
- OpenAI API for content moderation
- Perspective API as fallback
- Discord API via Discord.js 14

### Database Schema

#### Core Models

**User Model:**
```prisma
model User {
  id              String    @id @default(cuid())
  discordId       String    @unique
  username        String
  discriminator   String
  email           String?   @unique
  avatar          String?
  verified        Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  artworks        Artwork[]
  moderationLogs  ModerationLog[]
  sftpAccess      SftpAccess?
  discordRoles    UserDiscordRole[]
}
```

**Artwork Model:**
```prisma
model Artwork {
  id           String    @id @default(cuid())
  userId       String
  title        String
  description  String    @default("")
  filename     String
  fileUrl      String
  thumbnailUrl String?
  fileSize     Int
  mimeType     String
  width        Int?
  height       Int?
  nsfw         Boolean   @default(false)
  createdAt    DateTime  @default(now())
  
  // Relations
  user         User      @relation(fields: [userId], references: [id])
  tags         Tag[]
  comments     Comment[]
  likes        Like[]
}
```

**ModerationLog Model:**
```prisma
model ModerationLog {
  id           String    @id @default(cuid())
  guildId      String
  userId       String
  moderatorId  String
  action       ModAction
  reason       String
  duration     Int?      // In seconds
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())
  
  user         User      @relation(fields: [userId], references: [id])
}
```

## API Implementation

### Authentication System

**NextAuth.js Configuration:**
```typescript
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
      // Updates user with Discord data and fetches roles
    },
    async jwt({ token, user, account }) {
      // Adds user ID to JWT token
    },
  },
}
```

### Art Gallery API

**File Upload Endpoint (`/api/art/upload`):**
- Validates file type and size
- Processes images with Sharp
- Creates thumbnails (max 400x400)
- Moderates content with AI
- Stores metadata in database
- Returns artwork object with relations

**Key Features:**
- File size limit: 10MB (configurable)
- Allowed types: JPEG, PNG, GIF, WebP
- Automatic thumbnail generation
- Tag system with upsert logic
- NSFW flagging
- AI content moderation

### Moderation System

**Content Moderation (`/src/lib/moderation/`):**
```typescript
export async function moderateContent(content: string): Promise<ModerationResult> {
  // Primary: OpenAI Moderation API
  const response = await openai.moderations.create({ input: content })
  
  // Fallback: Perspective API
  // Final fallback: Basic word filtering
}
```

**Moderation Flow:**
1. OpenAI API for comprehensive content analysis
2. Perspective API if OpenAI fails
3. Basic word filter as final fallback
4. Returns flagged status with category and severity

### SFTP System

**SFTP Management (`/src/lib/sftp/`):**
```typescript
export class SftpManager {
  static async createUserAccess(config: SftpUserConfig): Promise<void> {
    // Creates user home directory
    // Updates database record
    // Generates SSH keys if needed
    // Updates system configuration
  }
}
```

**Key Features:**
- SSH key generation and management
- Per-user chrooted directories
- Role-based permissions mapping
- Automatic authorized_keys management
- Connection info generation

## Discord Bot Implementation

### Bot Architecture

**Main Bot (`/bot/index.ts`):**
```typescript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
})
```

### Slash Commands

**Implemented Commands:**
- `/warn` - Warn a user with database logging
- `/mute` - Timeout user with duration
- `/kick` - Kick user from server
- `/ban` - Ban user with message deletion options

**Command Structure:**
```typescript
export interface Command {
  data: SlashCommandBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}
```

**Common Features:**
- Permission checks
- Database logging
- DM notifications to users
- Embed responses
- Error handling

### Event Handlers

**Guild Monitoring:**
- Member join/leave tracking
- Message statistics
- Role change detection
- Server statistics updates

## Security Implementation

### Input Validation

**File Upload Security:**
- MIME type validation
- File size limits
- Extension checking
- Content scanning with Sharp

**API Security:**
- Zod schema validation
- Rate limiting (planned)
- CORS configuration
- Authentication middleware

### Content Moderation

**Multi-layer Approach:**
1. OpenAI Moderation API
2. Perspective API fallback
3. Basic word filtering
4. Manual review queue

**Flagging Categories:**
- Hate speech
- Harassment
- NSFW content
- Violence
- Spam
- Self-harm

## Performance Optimizations

### Image Processing

**Sharp Integration:**
- Automatic thumbnail generation
- Image optimization
- Metadata extraction
- Format conversion

### Database Optimization

**Prisma Configuration:**
- Connection pooling
- Prepared statements
- Proper indexing
- Relation loading optimization

### Caching Strategy

**Current Implementation:**
- Next.js static generation
- Image optimization
- Database query optimization

## Development Workflow

### Code Quality

**Tools:**
- ESLint with TypeScript rules
- Prettier for formatting
- TypeScript strict mode
- Vitest for unit testing
- Playwright for E2E testing

### Database Management

**Prisma Workflow:**
```bash
# Generate client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Deploy to production
npm run prisma:deploy

# Open studio
npm run prisma:studio
```

### Testing Strategy

**Unit Tests:**
- API route testing
- Utility function testing
- Component testing with React Testing Library

**E2E Tests:**
- User authentication flow
- Art upload process
- Moderation workflows
- Discord bot commands

## Deployment Architecture

### Docker Configuration

**Multi-container Setup:**
- Main application container
- Discord bot container
- PostgreSQL database
- Redis for caching (planned)

### Environment Configuration

**Required Variables:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Discord
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
DISCORD_BOT_TOKEN="..."
DISCORD_GUILD_ID="..."

# Moderation
OPENAI_API_KEY="..."
PERSPECTIVE_API_KEY="..."

# File Storage
UPLOAD_DIR="/var/www/uploads"
UPLOAD_MAX_FILE_SIZE="10485760"
```

### Production Considerations

**Security:**
- HTTPS enforcement
- Environment variable security
- Database connection encryption
- File upload validation

**Monitoring:**
- Winston logging
- Error tracking
- Performance monitoring
- Database query monitoring

## Error Handling

### Application Errors

**Error Boundaries:**
- React error boundaries for UI
- API error handling with proper status codes
- Database error handling with Prisma

### Discord Bot Errors

**Error Management:**
- Command execution errors
- Permission errors
- Rate limit handling
- Network error recovery

## API Rate Limiting

### Current Implementation

**Basic Rate Limiting:**
- File upload limits
- API endpoint protection
- Discord API rate limiting

### Planned Enhancements

**Advanced Rate Limiting:**
- Redis-based rate limiting
- Per-user rate limits
- Dynamic rate limiting
- Burst protection

## Monitoring and Logging

### Application Logging

**Winston Configuration:**
```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
})
```

### Database Monitoring

**Prisma Logging:**
- Query performance
- Connection pool status
- Error tracking
- Slow query detection

## Future Enhancements

### Planned Features

**Real-time Communication:**
- WebSocket implementation
- Live chat system
- Real-time notifications
- Collaborative features

**Performance Improvements:**
- Redis caching
- CDN integration
- Database sharding
- Load balancing

**Security Enhancements:**
- Advanced rate limiting
- WAF integration
- Security audit logging
- Penetration testing

## Troubleshooting

### Common Issues

**Database Connection:**
- Check DATABASE_URL format
- Verify PostgreSQL service
- Check network connectivity
- Validate credentials

**Discord Bot:**
- Verify bot token
- Check guild ID
- Validate permissions
- Test slash command registration

**File Uploads:**
- Check directory permissions
- Verify file size limits
- Test image processing
- Check MIME type validation

### Debug Commands

```bash
# Check database connection
npm run prisma:studio

# Test bot commands
npm run dev:bot

# Run tests
npm test

# Check logs
npm run logs
```

## Contributing Guidelines

### Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment: `cp env.example .env`
4. Run migrations: `npm run prisma:migrate`
5. Start development: `npm run dev`

### Code Standards

- Follow TypeScript strict mode
- Use Prettier for formatting
- Write tests for new features
- Document API changes
- Follow commit message conventions

### Pull Request Process

1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval
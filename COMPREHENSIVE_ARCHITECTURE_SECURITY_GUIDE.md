# Architecture & Security Implementation Guide

## System Architecture

### Current Implementation Overview

The Mirage Community Platform uses a microservices-oriented architecture with the following components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Load Balancer                              │
│                     (Nginx + Let's Encrypt SSL)                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────────┐
│                     Next.js 15 Application                          │
│                     (App Router + API Routes)                       │
└─────────┬───────────────────────────────────────────────────────┬───┘
          │                                                       │
┌─────────▼──────────┐                                 ┌─────────▼──────────┐
│   Web Application  │                                 │   Discord Bot      │
│   (Port 3000)      │                                 │   (Discord.js 14)  │
│                    │                                 │                    │
│ ┌─────────────────┐│                                 │ ┌─────────────────┐│
│ │  NextAuth.js    ││                                 │ │  Slash Commands ││
│ │  Authentication ││                                 │ │  Event Handlers ││
│ │                 ││                                 │ │  Moderation     ││
│ └─────────────────┘│                                 │ └─────────────────┘│
│                    │                                 │                    │
│ ┌─────────────────┐│                                 │ ┌─────────────────┐│
│ │  API Routes     ││                                 │ │  Guild Monitor  ││
│ │  /api/auth      ││                                 │ │  Stats Collector││
│ │  /api/art       ││                                 │ │  Database Sync  ││
│ │  /api/stats     ││                                 │ └─────────────────┘│
│ │  /api/moderation││                                 │                    │
│ └─────────────────┘│                                 └─────────┬──────────┘
│                    │                                           │
│ ┌─────────────────┐│                                           │
│ │  File Storage   ││                                           │
│ │  (Local/Sharp)  ││                                           │
│ └─────────────────┘│                                           │
└─────────┬──────────┘                                           │
          │                                                       │
          └──────────────────────┬────────────────────────────────┘
                                 │
                   ┌─────────────▼──────────┐
                   │   PostgreSQL 15        │
                   │   (Prisma ORM)         │
                   │                        │
                   │ ┌─────────────────────┐│
                   │ │  User Data          ││
                   │ │  Guild Stats        ││
                   │ │  Artwork Storage    ││
                   │ │  Moderation Logs    ││
                   │ │  SFTP Access        ││
                   │ └─────────────────────┘│
                   └────────────────────────┘
```

### Component Details

#### Next.js Application
- **Framework**: Next.js 15.0.0-rc.1 with App Router
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.5.3
- **Styling**: Tailwind CSS 3.4.4
- **Components**: Radix UI + Framer Motion

#### Discord Bot
- **Library**: Discord.js 14.15.0
- **Commands**: Slash command architecture
- **Intents**: Guilds, Members, Messages, Moderation, Content
- **Database**: Shared PostgreSQL instance

#### Database
- **Engine**: PostgreSQL 15
- **ORM**: Prisma 5.19.0
- **Migrations**: Automated with Prisma Migrate
- **Indexing**: Optimized for common queries

## Security Implementation

### Authentication & Authorization

#### NextAuth.js Implementation
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
      // Validates Discord user and updates database
    },
    async jwt({ token, user, account }) {
      // Adds user ID to JWT for API access
    },
  },
}
```

#### Role-Based Access Control
```typescript
// Discord role mapping to application permissions
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  MODERATOR: ['moderation.*', 'sftp.manage'],
  ARTIST: ['art.upload', 'sftp.read'],
  MEMBER: ['art.view', 'art.comment']
}
```

### Input Validation & Sanitization

#### File Upload Security
```typescript
// Implemented in /api/art/upload
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Validation flow:
1. File size validation
2. MIME type checking
3. Extension validation
4. Sharp image processing (validates actual image)
5. Content moderation (AI-powered)
```

#### API Input Validation
```typescript
// Using Zod schemas
const ArtworkSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  tags: z.string().optional(),
  nsfw: z.boolean().optional()
})
```

### Content Moderation System

#### Multi-Layer Moderation
```typescript
export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    // Primary: OpenAI Moderation API
    const openaiResult = await openai.moderations.create({ input: content })
    if (openaiResult.results[0].flagged) {
      return processOpenAIResult(openaiResult)
    }
  } catch (error) {
    // Fallback: Perspective API
    try {
      const perspectiveResult = await moderateWithPerspective(content)
      return perspectiveResult
    } catch (fallbackError) {
      // Final fallback: Basic word filtering
      return basicWordFilter(content)
    }
  }
}
```

#### Moderation Categories
- **Hate Speech**: Detected via OpenAI + Perspective API
- **Harassment**: Multi-API detection with severity scoring
- **NSFW Content**: Image analysis + text content
- **Violence**: Threat detection and graphic content
- **Spam**: Pattern recognition and link analysis
- **Self-Harm**: Sensitive content detection

### Database Security

#### Connection Security
```typescript
// Prisma configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // SSL mode enforced in production
}

// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

#### Query Security
- **Parameterized Queries**: Prisma ORM prevents SQL injection
- **Access Control**: Row-level security planned
- **Audit Logging**: All moderation actions logged
- **Data Validation**: Schema-level constraints

### File System Security

#### Upload Security
```typescript
// File storage implementation
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads'

// Security measures:
1. Unique filename generation (UUID)
2. User-specific directories
3. File type validation
4. Size limits
5. Thumbnail generation with Sharp
6. Metadata sanitization
```

#### SFTP Security
```typescript
// SFTP implementation
export class SftpManager {
  static async createUserAccess(config: SftpUserConfig): Promise<void> {
    // Security features:
    // 1. Chrooted environment
    // 2. SSH key-based authentication
    // 3. Role-based permissions
    // 4. Directory isolation
    // 5. Command restrictions
  }
}
```

### API Security

#### Rate Limiting
```typescript
// Current implementation (basic)
const RATE_LIMITS = {
  '/api/art/upload': '5 per 10 minutes',
  '/api/auth/*': '10 per minute',
  '/api/moderation/*': '20 per minute'
}

// Planned: Redis-based rate limiting
```

#### CORS Configuration
```typescript
// Next.js configuration
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXTAUTH_URL || 'http://localhost:3000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

### Discord Bot Security

#### Command Security
```typescript
// Permission validation for each command
export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  async execute(interaction) {
    // Security checks:
    // 1. Permission validation
    // 2. Target user validation
    // 3. Self-action prevention
    // 4. Bot protection
    // 5. Database logging
  }
}
```

#### Event Security
```typescript
// Discord event handler security
client.on('messageCreate', async (message) => {
  // Security measures:
  // 1. Bot message filtering
  // 2. Content moderation
  // 3. Rate limit checking
  // 4. Spam detection
  // 5. Audit logging
})
```

## Performance & Scalability

### Database Optimization

#### Indexing Strategy
```sql
-- Key indexes implemented
CREATE INDEX idx_user_discord_id ON "User"("discordId");
CREATE INDEX idx_artwork_user_id ON "Artwork"("userId");
CREATE INDEX idx_moderation_log_guild_id ON "ModerationLog"("guildId");
CREATE INDEX idx_moderation_log_user_id ON "ModerationLog"("userId");
```

#### Query Optimization
```typescript
// Optimized queries with select/include
const artworks = await prisma.artwork.findMany({
  select: {
    id: true,
    title: true,
    thumbnailUrl: true,
    user: {
      select: {
        username: true,
        avatar: true
      }
    },
    _count: {
      select: {
        likes: true,
        comments: true
      }
    }
  },
  take: 20,
  orderBy: { createdAt: 'desc' }
})
```

### Image Processing

#### Sharp Integration
```typescript
// Optimized image processing
const processImage = async (buffer: Buffer) => {
  const image = sharp(buffer)
  const metadata = await image.metadata()
  
  // Create optimized thumbnail
  const thumbnail = await image
    .resize(400, 400, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 80 })
    .toBuffer()
  
  return { metadata, thumbnail }
}
```

### Caching Strategy

#### Current Implementation
- **Next.js Static Generation**: Pre-rendered pages
- **Image Optimization**: Next.js built-in optimization
- **API Response Caching**: Planned Redis implementation

#### Planned Enhancements
- **Redis Caching**: Session storage, rate limiting
- **CDN Integration**: Static asset delivery
- **Database Query Caching**: Frequently accessed data

## Monitoring & Logging

### Application Logging

#### Winston Configuration
```typescript
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})
```

### Error Tracking

#### Error Handling Strategy
```typescript
// API error handling
export default async function handler(req: NextRequest) {
  try {
    // API logic
  } catch (error) {
    logger.error('API Error:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Performance Monitoring

#### Metrics Collection
- **Response Times**: API endpoint performance
- **Database Queries**: Query execution time
- **File Upload**: Processing time and success rates
- **Discord Bot**: Command execution metrics

## Deployment Security

### Environment Configuration

#### Production Environment
```bash
# Security-focused environment variables
NODE_ENV=production
NEXTAUTH_URL=https://themirage.xxx
NEXTAUTH_SECRET=<strong-random-secret>

# Database security
DATABASE_URL=postgresql://user:password@localhost:5432/mirage?sslmode=require

# API Keys (encrypted in production)
OPENAI_API_KEY=<encrypted-key>
DISCORD_BOT_TOKEN=<encrypted-token>
```

### Container Security

#### Docker Configuration
```dockerfile
# Security-hardened Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY --chown=nextjs:nodejs . .

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Network Security

#### Firewall Configuration
```bash
# UFW firewall rules
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw allow 2222/tcp  # SFTP
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

#### SSL/TLS Configuration
```nginx
# Nginx SSL configuration
ssl_certificate /etc/letsencrypt/live/themirage.xxx/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/themirage.xxx/privkey.pem;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
```

## Risk Assessment & Mitigation

### Identified Risks

#### High-Risk Areas
1. **File Upload System**
   - **Risk**: Malicious file uploads
   - **Mitigation**: Type validation, size limits, sandboxed processing

2. **Discord Bot Permissions**
   - **Risk**: Privilege escalation
   - **Mitigation**: Strict permission checking, audit logging

3. **Database Access**
   - **Risk**: SQL injection, data breaches
   - **Mitigation**: Parameterized queries, access controls

4. **API Endpoints**
   - **Risk**: Rate limiting bypass, DDoS
   - **Mitigation**: Multiple rate limiting layers, monitoring

#### Medium-Risk Areas
1. **Content Moderation**
   - **Risk**: False positives/negatives
   - **Mitigation**: Multi-layer detection, human review

2. **SFTP Access**
   - **Risk**: Directory traversal
   - **Mitigation**: Chrooted environment, path validation

3. **Session Management**
   - **Risk**: Session hijacking
   - **Mitigation**: Secure cookies, token rotation

### Incident Response Plan

#### Security Incident Workflow
1. **Detection**: Monitoring alerts, user reports
2. **Assessment**: Severity evaluation, impact analysis
3. **Containment**: Immediate threat mitigation
4. **Investigation**: Root cause analysis
5. **Recovery**: Service restoration, patches
6. **Documentation**: Incident report, lessons learned

#### Emergency Contacts
- System Administrator: Immediate response
- Database Administrator: Data integrity issues
- Security Team: Breach investigation
- Legal Team: Compliance matters

## Compliance & Auditing

### Data Protection

#### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Right to Access**: User data export functionality
- **Right to Deletion**: Account deletion with data purging
- **Data Portability**: Export in standard formats

#### Audit Trail
```typescript
// Moderation action logging
await prisma.moderationLog.create({
  data: {
    guildId: interaction.guildId!,
    userId: target.id,
    moderatorId: interaction.user.id,
    action: 'BAN',
    reason: reason,
    timestamp: new Date(),
    metadata: JSON.stringify({
      deletedMessages: deleteDays,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })
  }
})
```

### Security Auditing

#### Regular Security Reviews
- **Monthly**: Dependency updates, vulnerability scanning
- **Quarterly**: Penetration testing, code review
- **Annually**: Security architecture review, compliance audit

#### Security Tools
- **Dependency Scanning**: npm audit, Snyk
- **Code Analysis**: ESLint security rules, SonarJS
- **Runtime Security**: Helmet.js, CORS configuration
- **Monitoring**: Winston logging, error tracking

## Future Security Enhancements

### Planned Improvements

#### Advanced Rate Limiting
- Redis-based distributed rate limiting
- Adaptive rate limiting based on user behavior
- Geographic rate limiting for high-risk regions

#### Enhanced Monitoring
- Real-time security dashboard
- Anomaly detection for unusual patterns
- Automated threat response

#### Security Automation
- Automated security testing in CI/CD
- Dependency vulnerability alerts
- Security patch deployment automation

### Security Roadmap

#### Phase 1 (Current)
- ✅ Basic authentication with NextAuth.js
- ✅ File upload validation
- ✅ Content moderation system
- ✅ Database security with Prisma

#### Phase 2 (3-6 months)
- 🔄 Advanced rate limiting with Redis
- 🔄 Security monitoring dashboard
- 🔄 Automated security testing

#### Phase 3 (6-12 months)
- 📋 WAF implementation
- 📋 Advanced threat detection
- 📋 Security incident automation
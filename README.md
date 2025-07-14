# The Mirage Community Platform

A full-stack community platform built with Next.js 15 RC, Discord.js 14, and PostgreSQL, featuring Discord integration, art gallery, moderation system, and SFTP access.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 RC, React 19 RC, TypeScript, Tailwind CSS
- **Backend**: PostgreSQL 15, Prisma ORM, NextAuth.js
- **Discord Bot**: Discord.js 14 with slash commands
- **Graphics**: Three.js, React Three Fiber
- **UI Components**: Radix UI, Framer Motion
- **Image Processing**: Sharp
- **Content Moderation**: OpenAI API, Perspective API (fallback)
- **Development**: Vitest, Playwright, ESLint, Prettier

### Core Features Implemented

#### 🎨 Art Gallery
- **File Upload**: Secure local storage with image processing
- **Image Processing**: Sharp for thumbnails and optimization
- **Tagging System**: Organize artwork with searchable tags
- **NSFW Flagging**: Community-driven content classification
- **Moderation Integration**: AI-powered content filtering
- **Engagement**: Likes and comments system

#### 🔧 Discord Bot
- **Slash Commands**: `/warn`, `/mute`, `/kick`, `/ban`
- **Moderation Logging**: Database tracking of all actions
- **Role Sync**: Discord roles mapped to platform permissions
- **Guild Monitoring**: Real-time server statistics
- **DM Notifications**: Users notified of moderation actions

#### 🛡️ Moderation System
- **AI Content Filtering**: OpenAI API for text moderation
- **Fallback System**: Perspective API when OpenAI unavailable
- **Basic Word Filter**: Fallback content filtering
- **Moderation Queue**: Review flagged content
- **Audit Trail**: Complete moderation history

#### 🔐 SFTP Access
- **SSH Key Management**: Generate or upload SSH keys
- **Role-based Permissions**: Discord roles → filesystem permissions
- **Chrooted Environment**: Secure user isolation
- **Per-user Directories**: Isolated file spaces
- **Connection Management**: Enable/disable access per user

#### 🔒 Security
- **Authentication**: NextAuth.js with Discord OAuth
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **File Upload Security**: Type and size validation
- **Database Security**: Parameterized queries with Prisma

## 🚀 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Discord Application & Bot Token
- OpenAI API Key (optional, for moderation)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd mirage-community
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

4. **Development**
   ```bash
   npm run dev  # Starts both Next.js and Discord bot
   ```

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   │   ├── art/           # Art gallery endpoints
│   │   ├── auth/          # NextAuth.js
│   │   ├── moderation/    # Moderation queue
│   │   └── stats/         # Server statistics
│   ├── dashboard/         # Admin dashboard
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Radix UI components
│   ├── three/            # Three.js components
│   └── layout/           # Layout components
├── lib/                   # Utilities and services
│   ├── auth.ts           # NextAuth configuration
│   ├── moderation/       # Content moderation
│   ├── sftp/             # SFTP management
│   └── prisma.ts         # Database client
└── types/                # TypeScript definitions

bot/
├── commands/              # Discord slash commands
├── events/               # Discord event handlers
├── utils/                # Bot utilities
└── index.ts              # Bot entry point

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mirage"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Discord
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
DISCORD_BOT_TOKEN="your-bot-token"
DISCORD_GUILD_ID="your-guild-id"

# Content Moderation (Optional)
OPENAI_API_KEY="your-openai-key"
PERSPECTIVE_API_KEY="your-perspective-key"

# File Upload
UPLOAD_DIR="/var/www/uploads"
UPLOAD_MAX_FILE_SIZE="10485760"  # 10MB
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/gif,image/webp"

# SFTP (Optional)
SFTP_BASE_PATH="/var/www/uploads"
SFTP_PORT="2222"
```

### Discord Bot Setup
1. Create Discord Application at https://discord.com/developers/applications
2. Create bot and get token
3. Enable required intents: Guilds, Guild Members, Guild Messages, Guild Moderation, Message Content
4. Invite bot with permissions: Kick Members, Ban Members, Moderate Members

## 📊 Database Schema

### Key Models
- **User**: Discord OAuth user data
- **Artwork**: Art gallery items with metadata
- **ModerationLog**: Moderation action history
- **SftpAccess**: SFTP user configurations
- **DiscordGuild**: Server statistics and configuration
- **DiscordRole**: Role-based permissions

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## � Deployment

### Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Build application: `npm run build`
2. Set up systemd services (examples in `config/`)
3. Configure Nginx reverse proxy
4. Set up SSL with Let's Encrypt
5. Configure firewall and security

## 📚 API Documentation

### Art Gallery API
- `POST /api/art/upload` - Upload artwork
- `GET /api/art` - List artworks
- `POST /api/art/[id]/like` - Like artwork
- `POST /api/art/[id]/comment` - Add comment

### Moderation API
- `GET /api/moderation/queue` - Get moderation queue
- `POST /api/moderation/approve` - Approve content
- `POST /api/moderation/reject` - Reject content

### Statistics API
- `GET /api/stats` - Server statistics
- `GET /api/stats/guild` - Discord guild stats

## � Development Workflow

1. **Code Quality**: ESLint + Prettier + TypeScript strict mode
2. **Testing**: Vitest for unit tests, Playwright for E2E
3. **Database**: Prisma migrations for schema changes
4. **Security**: Regular dependency updates, security audits
5. **Performance**: Bundle analysis, Core Web Vitals monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m "Add new feature"`
5. Push to branch: `git push origin feature/new-feature`
6. Create Pull Request

## � License

This project is licensed under the MIT License. 
# The Mirage Community Platform

A full-stack community backend built with TypeScript, Next.js 14, Discord.js, and PostgreSQL for themirage.xxx.

## 🚀 Features

### Discord Integration
- **OAuth2 Authentication**: Sign in with Discord
- **Real-time Bot**: Moderation commands, stats tracking, and auto-moderation
- **Role Sync**: Discord roles mapped to platform permissions
- **Server Statistics**: Live member count, online users, and message analytics

### Art Gallery
- **Secure Uploads**: Local storage with image processing
- **Tagging System**: Organize artwork with tags
- **Engagement**: Likes and comments on artworks
- **Moderation**: NSFW flagging and content moderation

### Moderation System
- **Auto-moderation**: OpenAI/Perspective API integration
- **Slash Commands**: `/warn`, `/mute`, `/kick`, `/ban`
- **Quarantine Queue**: Review flagged content
- **Audit Logs**: Complete moderation history

### SFTP Access
- **SSH Key Management**: Generate or upload keys
- **Role-based Permissions**: Map Discord roles to filesystem access
- **Chrooted Environment**: Secure user isolation
- **Web UI**: Manage access through the dashboard

### Security
- **Rate Limiting**: API and auth endpoint protection
- **CSRF/CORS Protection**: Secure cross-origin requests
- **Content Security Policy**: XSS prevention
- **Fail2Ban Integration**: Brute-force protection

## 📋 Prerequisites

- Debian 12 (Bookworm) VPS
- Domain name (configured: themirage.xxx)
- Discord Application & Bot Token
- PostgreSQL 15+
- Node.js 18+
- Nginx
- SSL Certificate (Let's Encrypt)

## 🛠️ Quick Start

### 1. Server Setup

Run the automated setup script as root:

```bash
sudo ./scripts/debian-setup.sh
```

This installs and configures:
- Node.js 18 via NodeSource
- PostgreSQL 15
- Nginx with SSL
- Redis
- UFW Firewall
- Fail2Ban
- Docker (optional)

### 2. Clone Repository

```bash
cd /home/linuxuser
git clone https://github.com/yourusername/mirage-community.git
cd mirage-community
```

### 3. Environment Configuration

```bash
cp env.example .env
nano .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `DISCORD_CLIENT_ID`: Discord OAuth app ID
- `DISCORD_CLIENT_SECRET`: Discord OAuth secret
- `DISCORD_BOT_TOKEN`: Bot authentication token
- `DISCORD_GUILD_ID`: Your Discord server ID
- `OPENAI_API_KEY`: For content moderation

### 4. Install Dependencies

```bash
npm install
```

### 5. Database Setup

```bash
# Run migrations
npm run prisma:deploy

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 6. Build Application

```bash
npm run build
```

### 7. Configure Services

```bash
# Copy service files
sudo cp config/mirage-app.service /etc/systemd/system/
sudo cp config/mirage-bot.service /etc/systemd/system/

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable mirage-app mirage-bot
sudo systemctl start mirage-app mirage-bot
```

### 8. Configure Nginx

```bash
# Copy Nginx config
sudo cp config/nginx.conf /etc/nginx/sites-available/themirage.xxx
sudo ln -s /etc/nginx/sites-available/themirage.xxx /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 9. SSL Certificate

```bash
sudo certbot --nginx -d themirage.xxx -d www.themirage.xxx
```

## 🐳 Docker Deployment

Alternative deployment using Docker Compose:

```bash
# Copy environment file
cp env.example .env
# Edit configuration
nano .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
mirage-community/
├── .github/workflows/    # CI/CD workflows
├── bot/                  # Discord bot
│   ├── commands/        # Slash commands
│   ├── events/          # Event handlers
│   └── utils/           # Bot utilities
├── config/              # Configuration files
│   ├── nginx.conf       # Nginx configuration
│   ├── *.service        # Systemd services
├── prisma/              # Database schema
├── public/              # Static assets
├── scripts/             # Setup scripts
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── api/        # API routes
│   │   ├── dashboard/  # Dashboard pages
│   │   ├── gallery/    # Art gallery
│   │   └── moderation/ # Mod tools
│   ├── components/     # React components
│   ├── lib/           # Core libraries
│   │   ├── auth.ts    # NextAuth config
│   │   ├── prisma.ts  # Database client
│   │   ├── moderation/# Content moderation
│   │   └── sftp/      # SFTP management
│   └── types/         # TypeScript types
├── docker-compose.yml   # Docker configuration
├── Dockerfile          # App container
└── Dockerfile.bot      # Bot container
```

## 🔧 Development

### Local Development

```bash
# Start development servers
npm run dev

# This runs both:
# - Next.js dev server (port 3000)
# - Discord bot with hot reload
```

### Database Management

```bash
# Create migration
npm run prisma:migrate

# Apply migrations
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 📊 API Endpoints

### Public Endpoints
- `GET /api/stats` - Server statistics

### Protected Endpoints
- `POST /api/art/upload` - Upload artwork
- `GET /api/art/[id]` - Get artwork details
- `POST /api/art/[id]/like` - Like artwork
- `POST /api/art/[id]/comment` - Add comment

### Moderation Endpoints
- `GET /api/moderation/queue` - Get flagged content
- `POST /api/moderation/queue` - Process moderation action
- `GET /api/moderation/logs` - Get moderation history

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database**: Use strong passwords, enable SSL
3. **File Uploads**: Validate types, scan for malware
4. **Rate Limiting**: Configured per endpoint
5. **CORS**: Restricted to your domain
6. **CSP**: Strict content security policy

## 🚀 Deployment

### GitHub Actions

The project includes automated deployment:

1. Push to `main` branch
2. Tests run automatically
3. Deploys to VPS via SSH
4. Restarts services
5. Sends Discord notification

Required GitHub Secrets:
- `VPS_HOST`: Your server IP
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: Private SSH key
- `VPS_PORT`: SSH port (22)
- `DISCORD_WEBHOOK`: Notification webhook

### Manual Deployment

```bash
./deploy.sh
```

## 📝 Maintenance

### Logs

```bash
# View app logs
journalctl -u mirage-app -f

# View bot logs
journalctl -u mirage-bot -f

# Nginx logs
tail -f /var/log/nginx/themirage.access.log
tail -f /var/log/nginx/themirage.error.log
```

### Backups

```bash
# Backup database
pg_dump mirage_community > backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz /var/www/uploads
```

### Updates

```bash
# System updates
sudo apt update && sudo apt upgrade

# Node.js updates
npm update

# Security updates (automatic)
# Configured via unattended-upgrades
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ for The Mirage Community
- Powered by Next.js, Discord.js, and PostgreSQL
- Secured with Let's Encrypt SSL

---

For support, join our Discord: [discord.gg/yourinvite](https://discord.gg/yourinvite) 
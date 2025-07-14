#!/bin/bash

# Cursor Background Agent Setup Script
# This script sets up the automated Cursor background agent system

set -e

echo "🤖 Cursor Background Agent Setup"
echo "==============================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Install required dependencies
echo "📦 Installing dependencies..."
npm install --save node-cron axios winston express

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p config

# Set up systemd service
echo "🔧 Setting up systemd service..."
sudo tee /etc/systemd/system/cursor-agent-scheduler.service > /dev/null <<EOF
[Unit]
Description=Cursor Background Agent Scheduler
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$(pwd)
Environment="NODE_ENV=production"
Environment="AGENT_SCHEDULER_ENABLED=true"
ExecStart=/usr/bin/node scripts/agent-scheduler.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$(pwd)/logs
ReadWritePaths=/tmp

# Resource limits
LimitNOFILE=4096
LimitNPROC=256

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cursor-agent-scheduler

[Install]
WantedBy=multi-user.target
EOF

# Update environment variables
echo "🌍 Setting up environment variables..."
if [[ ! -f ".env" ]]; then
    cp env.example .env
fi

# Add agent-specific environment variables if they don't exist
if ! grep -q "AGENT_SCHEDULER_ENABLED" .env; then
    echo "" >> .env
    echo "# Cursor Background Agent Configuration" >> .env
    echo "AGENT_SCHEDULER_ENABLED=true" >> .env
    echo "CURSOR_API_TOKEN=your_cursor_api_token_here" >> .env
    echo "GITHUB_REPO=your_username/your_repo" >> .env
    echo "SLACK_WEBHOOK_URL=your_slack_webhook_url_here" >> .env
    echo "GITHUB_WEBHOOK_SECRET=your_github_webhook_secret_here" >> .env
    echo "WEBHOOK_PORT=3001" >> .env
    echo "MONITOR_PORT=3002" >> .env
fi

# Update package.json scripts
echo "📝 Updating package.json scripts..."
if ! grep -q "agent:start" package.json; then
    # Add agent scripts using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['agent:start'] = 'node scripts/agent-scheduler.js';
        pkg.scripts['agent:monitor'] = 'node scripts/agent-monitor.js';
        pkg.scripts['agent:webhook'] = 'node scripts/webhook-handler.js';
        pkg.scripts['agent:dev'] = 'concurrently \"npm run agent:start\" \"npm run agent:monitor\" \"npm run agent:webhook\"';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

# Update Docker Compose
echo "🐳 Updating Docker Compose configuration..."
if [[ -f "docker-compose.yml" ]]; then
    if ! grep -q "cursor-agent-scheduler" docker-compose.yml; then
        cat >> docker-compose.yml << 'EOF'

  # Cursor Agent Scheduler
  cursor-agent-scheduler:
    build:
      context: .
      dockerfile: Dockerfile.agent
    container_name: mirage_cursor_agent
    restart: unless-stopped
    depends_on:
      - app
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      AGENT_SCHEDULER_ENABLED: ${AGENT_SCHEDULER_ENABLED:-true}
      CURSOR_API_TOKEN: ${CURSOR_API_TOKEN}
      GITHUB_REPO: ${GITHUB_REPO}
      SLACK_WEBHOOK_URL: ${SLACK_WEBHOOK_URL}
      GITHUB_WEBHOOK_SECRET: ${GITHUB_WEBHOOK_SECRET}
    volumes:
      - ./logs:/app/logs
      - ./scripts:/app/scripts
    ports:
      - "3001:3001"
      - "3002:3002"
    command: node scripts/agent-scheduler.js
EOF
        echo "✅ Docker Compose updated"
    fi
fi

# Update deployment script
echo "🚀 Updating deployment script..."
if [[ -f "deploy.sh" ]]; then
    if ! grep -q "cursor-agent-scheduler" deploy.sh; then
        # Add agent restart to deployment script
        sed -i '/sudo systemctl restart mirage-bot/a sudo systemctl restart cursor-agent-scheduler' deploy.sh
        echo "✅ Deployment script updated"
    fi
fi

# Update log rotation
echo "📋 Setting up log rotation..."
if [[ -f "/etc/logrotate.d/mirage" ]]; then
    if ! grep -q "agent*.log" /etc/logrotate.d/mirage; then
        sudo sed -i '/mirage-community\/logs\/\*\.log/a $(pwd)/logs/agent*.log' /etc/logrotate.d/mirage
        echo "✅ Log rotation updated"
    fi
fi

# Set permissions
echo "🔒 Setting file permissions..."
chmod +x scripts/*.js
chmod +x scripts/setup-cursor-agents.sh

# Enable and start services
echo "🚀 Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable cursor-agent-scheduler
sudo systemctl start cursor-agent-scheduler

# Check service status
echo "🔍 Checking service status..."
sleep 2
if systemctl is-active --quiet cursor-agent-scheduler; then
    echo "✅ Cursor agent scheduler is running"
else
    echo "❌ Cursor agent scheduler failed to start"
    sudo systemctl status cursor-agent-scheduler
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Cursor background agent automation system is now configured!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with your actual tokens and URLs"
echo "2. Configure Cursor background agents in the IDE:"
echo "   - Open Cursor Settings → Background Agents"
echo "   - Connect to GitHub"
echo "   - Set up your base environment"
echo "   - Take a snapshot"
echo ""
echo "3. Access the monitoring dashboard at: http://localhost:3002"
echo "4. Configure GitHub webhooks to point to: http://your-domain:3001/webhook/github"
echo ""
echo "Available commands:"
echo "- npm run agent:start    # Start the agent scheduler"
echo "- npm run agent:monitor  # Start the monitoring dashboard"
echo "- npm run agent:webhook  # Start the webhook handler"
echo "- npm run agent:dev      # Start all services in development mode"
echo ""
echo "System service commands:"
echo "- sudo systemctl status cursor-agent-scheduler"
echo "- sudo systemctl restart cursor-agent-scheduler"
echo "- sudo systemctl logs cursor-agent-scheduler"
echo ""
echo "Configuration files created/updated:"
echo "- config/agents.json          # Agent configuration"
echo "- scripts/agent-scheduler.js  # Main scheduler"
echo "- scripts/agent-monitor.js    # Web dashboard"
echo "- scripts/webhook-handler.js  # GitHub webhook handler"
echo "- scripts/slack-notifier.js   # Slack integration"
echo "- Dockerfile.agent            # Docker configuration"
echo ""
echo "Happy automating! 🚀"
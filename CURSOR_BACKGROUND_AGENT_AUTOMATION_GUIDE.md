# Cursor Background Agent Automation Guide

## Overview

This guide shows you how to set up and automate Cursor background agents to run independently, leveraging your existing infrastructure and adding new automation capabilities.

## What Are Cursor Background Agents?

Cursor background agents are cloud-powered AI assistants that can:
- Run tasks while you're away from your IDE
- Execute multiple operations in parallel
- Handle complex multi-step workflows
- Create and manage pull requests automatically
- Perform code reviews and bug fixes autonomously

## Current Project Infrastructure

Your project already has solid automation foundations:

### Existing Automation Systems
- **Systemd Services**: `mirage-app.service` and `mirage-bot.service`
- **Docker Containers**: Multi-service setup with restart policies
- **Process Monitoring**: Winston logging and health checks
- **Automated Deployment**: `deploy.sh` script and Docker Compose

## Setting Up Cursor Background Agents

### 1. Enable Background Agents in Cursor

```bash
# Open Cursor Settings
# Navigate to: Settings → Beta Features → Background Agents
# Or use Command Palette: Cmd+Shift+P → "Cursor Settings"
```

### 2. Configure GitHub Integration

1. Go to **Settings → Background Agents**
2. Click **"Go To GitHub"** to authorize access
3. Select your repository (fork if it's an organization repo)
4. Click **"Refresh"** to verify access is granted

### 3. Set Up Base Environment

1. Click **"Base Environment"**
2. Select **"Setup machine interactively"**
3. Wait for chat interface to appear
4. Configure your environment with required dependencies

### 4. Environment Setup Script

Create an automated setup script for your project:

```bash
#!/bin/bash
# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install project dependencies
npm ci

# Set up environment variables
cp env.example .env.local

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Verify setup
npm run build
npm run test
```

### 5. Take Environment Snapshot

After setup is complete:
1. Click **"Take Snapshot"** to save the configured environment
2. Add any custom scripts or tools your project needs
3. Verify everything works correctly

## Automation Strategies

### 1. Scheduled Background Tasks

Create a systemd service for agent management:

```ini
# /etc/systemd/system/cursor-agent-scheduler.service
[Unit]
Description=Cursor Background Agent Scheduler
After=network.target

[Service]
Type=simple
User=linuxuser
Group=linuxuser
WorkingDirectory=/home/linuxuser/mirage-community
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node scripts/agent-scheduler.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Agent Scheduler Script

```javascript
// scripts/agent-scheduler.js
const { exec } = require('child_process');
const cron = require('node-cron');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/agent-scheduler.log' }),
    new winston.transports.Console()
  ]
});

// Schedule background agent tasks
const scheduleAgentTasks = () => {
  // Daily code review at 9 AM
  cron.schedule('0 9 * * *', () => {
    logger.info('Starting daily code review agent');
    triggerAgent('code-review', 'Perform daily code review and create PR for any issues found');
  });

  // Weekly dependency updates on Sundays
  cron.schedule('0 10 * * 0', () => {
    logger.info('Starting weekly dependency update agent');
    triggerAgent('dependency-update', 'Check for and update npm dependencies, run tests, create PR if successful');
  });

  // Security scan every night at 2 AM
  cron.schedule('0 2 * * *', () => {
    logger.info('Starting security scan agent');
    triggerAgent('security-scan', 'Run security audit and fix any vulnerabilities found');
  });
};

const triggerAgent = (taskType, prompt) => {
  const command = `curl -X POST "https://api.cursor.com/agents/trigger" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${process.env.CURSOR_API_TOKEN}" \
    -d '{"task": "${taskType}", "prompt": "${prompt}", "repository": "${process.env.GITHUB_REPO}"}'`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Agent trigger failed: ${error}`);
      return;
    }
    logger.info(`Agent ${taskType} triggered successfully`);
  });
};

scheduleAgentTasks();
logger.info('Cursor agent scheduler started');
```

### 3. Integration with Docker

Add agent management to your Docker Compose:

```yaml
# Add to docker-compose.yml
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
      CURSOR_API_TOKEN: ${CURSOR_API_TOKEN}
      GITHUB_REPO: ${GITHUB_REPO}
    volumes:
      - ./logs:/app/logs
      - ./scripts:/app/scripts
    command: node scripts/agent-scheduler.js
```

### 4. Agent Configuration File

Create a configuration file for your agents:

```json
// config/agents.json
{
  "agents": [
    {
      "name": "code-review",
      "description": "Automated code review and quality checks",
      "schedule": "0 9 * * *",
      "tasks": [
        "Run ESLint and fix auto-fixable issues",
        "Check for TypeScript errors",
        "Run tests and ensure coverage > 80%",
        "Create PR with fixes if any issues found"
      ]
    },
    {
      "name": "dependency-update",
      "description": "Update npm dependencies weekly",
      "schedule": "0 10 * * 0",
      "tasks": [
        "Check for outdated dependencies",
        "Update packages to latest compatible versions",
        "Run full test suite",
        "Create PR if all tests pass"
      ]
    },
    {
      "name": "security-scan",
      "description": "Nightly security audit",
      "schedule": "0 2 * * *",
      "tasks": [
        "Run npm audit",
        "Check for security vulnerabilities",
        "Update vulnerable packages",
        "Create security report"
      ]
    },
    {
      "name": "performance-monitor",
      "description": "Monitor and optimize performance",
      "schedule": "0 12 * * 1",
      "tasks": [
        "Analyze bundle size",
        "Check for performance regressions",
        "Optimize images and assets",
        "Update performance metrics"
      ]
    }
  ]
}
```

## Advanced Automation Features

### 1. Webhook Integration

Set up webhooks to trigger agents on specific events:

```javascript
// scripts/webhook-handler.js
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// GitHub webhook handler
app.post('/webhook/github', (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  switch (event) {
    case 'push':
      if (payload.ref === 'refs/heads/main') {
        triggerAgent('post-merge', 'Analyze recent changes and run deployment checks');
      }
      break;
    
    case 'pull_request':
      if (payload.action === 'opened') {
        triggerAgent('pr-review', `Review PR #${payload.number} and provide feedback`);
      }
      break;
    
    case 'issues':
      if (payload.action === 'opened') {
        triggerAgent('issue-analysis', `Analyze issue #${payload.issue.number} and suggest solutions`);
      }
      break;
  }

  res.status(200).send('OK');
});

app.listen(3001, () => {
  console.log('Webhook handler listening on port 3001');
});
```

### 2. Agent Monitoring Dashboard

Create a simple monitoring dashboard:

```javascript
// scripts/agent-monitor.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

app.get('/agents/status', (req, res) => {
  const logFile = path.join(__dirname, '../logs/agent-scheduler.log');
  
  try {
    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))
      .slice(-100); // Last 100 entries

    res.json({
      status: 'running',
      lastUpdate: new Date().toISOString(),
      recentLogs: logs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

app.listen(3002, () => {
  console.log('Agent monitor dashboard running on port 3002');
});
```

### 3. Slack Integration

Integrate with Slack for notifications:

```javascript
// scripts/slack-notifier.js
const axios = require('axios');

class SlackNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendAgentUpdate(agentName, status, details) {
    const message = {
      text: `Agent Update: ${agentName}`,
      attachments: [
        {
          color: status === 'success' ? 'good' : 'danger',
          fields: [
            {
              title: 'Status',
              value: status,
              short: true
            },
            {
              title: 'Agent',
              value: agentName,
              short: true
            },
            {
              title: 'Details',
              value: details,
              short: false
            }
          ]
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, message);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
}

module.exports = SlackNotifier;
```

## Best Practices

### 1. Security Considerations

- Store API tokens securely in environment variables
- Use least-privilege access for agent authentication
- Implement rate limiting to prevent abuse
- Monitor agent activity for suspicious behavior

### 2. Error Handling

- Implement robust error handling in all agent scripts
- Set up alerting for failed agent executions
- Create fallback mechanisms for critical tasks
- Log all agent activities for debugging

### 3. Performance Optimization

- Use parallel execution for independent tasks
- Implement caching for frequently accessed data
- Monitor resource usage and set appropriate limits
- Optimize agent prompts for better performance

### 4. Maintenance

- Regularly update agent configurations
- Monitor and adjust scheduling based on usage patterns
- Review and optimize agent performance metrics
- Keep dependencies updated for security

## Integration with Your Existing Setup

### 1. Update Deployment Script

Modify your existing `deploy.sh` to include agent setup:

```bash
#!/bin/bash
cd /home/linuxuser/mirage-community
git pull origin main
npm ci --production
npm run prisma:deploy
npm run build

# Restart services
sudo systemctl restart mirage-app
sudo systemctl restart mirage-bot
sudo systemctl restart cursor-agent-scheduler

# Update agent configurations
cp config/agents.json /home/linuxuser/.cursor/agents.json

echo "Deployment completed!"
```

### 2. Add to Systemd Management

```bash
# Enable and start the agent scheduler service
sudo systemctl enable cursor-agent-scheduler
sudo systemctl start cursor-agent-scheduler

# Check status
sudo systemctl status cursor-agent-scheduler
```

### 3. Environment Variables

Add to your `.env` file:

```env
# Cursor Background Agent Configuration
CURSOR_API_TOKEN=your_cursor_api_token
GITHUB_REPO=your_username/your_repo
SLACK_WEBHOOK_URL=your_slack_webhook_url
AGENT_SCHEDULER_ENABLED=true
```

## Monitoring and Logging

### 1. Log Rotation

Add agent logs to your existing log rotation:

```bash
# Add to /etc/logrotate.d/mirage
/home/linuxuser/mirage-community/logs/agent*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 linuxuser linuxuser
    sharedscripts
    postrotate
        systemctl reload cursor-agent-scheduler >/dev/null 2>&1 || true
    endscript
}
```

### 2. Health Checks

Add health checks to your monitoring system:

```javascript
// Add to existing monitoring
const checkAgentHealth = async () => {
  try {
    const response = await axios.get('http://localhost:3002/agents/status');
    return response.data.status === 'running';
  } catch (error) {
    return false;
  }
};
```

## Conclusion

By integrating Cursor background agents with your existing infrastructure, you can create a powerful automated development workflow that:

- Runs continuous code quality checks
- Manages dependencies automatically
- Handles security audits
- Monitors performance
- Responds to GitHub events
- Integrates with your team's communication tools

The key is to start small with basic automation and gradually expand as you become more comfortable with the system. Your existing systemd services, Docker setup, and monitoring infrastructure provide a solid foundation for building comprehensive agent automation.

Remember to:
- Test thoroughly in a development environment first
- Monitor agent performance and resource usage
- Keep security considerations in mind
- Maintain and update your automation scripts regularly

With this setup, your development workflow will become significantly more efficient and autonomous, allowing you to focus on high-level architecture and feature development while the agents handle routine maintenance and quality assurance tasks.
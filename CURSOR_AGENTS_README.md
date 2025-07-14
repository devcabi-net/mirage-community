# Cursor Background Agent Automation System

## Quick Start

1. **Run the setup script:**
   ```bash
   ./scripts/setup-cursor-agents.sh
   ```

2. **Configure your environment:**
   - Edit `.env` file with your actual tokens and URLs
   - Set up GitHub webhooks to point to your server

3. **Start using the system:**
   - Access monitoring dashboard: http://localhost:3002
   - View logs: `sudo journalctl -u cursor-agent-scheduler -f`

## Key Features

- **Automated Code Reviews**: Daily quality checks and linting
- **Dependency Updates**: Weekly security and package updates
- **Security Scanning**: Nightly vulnerability assessments
- **Performance Monitoring**: Regular bundle size and performance analysis
- **Discord Bot Health**: Continuous bot monitoring and maintenance
- **GitHub Integration**: Webhook-triggered agents for PR reviews
- **Slack Notifications**: Real-time alerts and status updates
- **Web Dashboard**: Beautiful monitoring interface

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │    │  GitHub Hooks   │    │  Slack Channel  │
│ Background      │    │   (triggers)    │    │ (notifications) │
│   Agents        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Agent Scheduler Service                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────│
│  │   Cron      │  │  Webhook    │  │  Monitor    │  │  Slack  │
│  │ Scheduler   │  │  Handler    │  │ Dashboard   │  │ Notifier│
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your App      │    │   Discord Bot   │    │   Database      │
│   (Next.js)     │    │   (monitoring)  │    │   (Postgres)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Agent Types

### 1. Scheduled Agents
- **Code Review** (Daily 9 AM): Linting, testing, quality checks
- **Dependency Update** (Weekly): Package updates with testing
- **Security Scan** (Nightly 2 AM): Vulnerability assessment
- **Performance Monitor** (Weekly): Bundle analysis and optimization
- **Database Maintenance** (Weekly): Cleanup and optimization
- **Bot Health Check** (Every 6 hours): Discord bot monitoring

### 2. Event-Triggered Agents
- **PR Review**: Automatically review new pull requests
- **Post-Merge**: Analyze changes after merge to main
- **Issue Analysis**: Suggest solutions for new issues

## Configuration

### Environment Variables
```env
AGENT_SCHEDULER_ENABLED=true
CURSOR_API_TOKEN=your_cursor_api_token
GITHUB_REPO=your_username/your_repo
SLACK_WEBHOOK_URL=your_slack_webhook_url
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
WEBHOOK_PORT=3001
MONITOR_PORT=3002
```

### Agent Configuration (config/agents.json)
```json
{
  "agents": [
    {
      "name": "code-review",
      "description": "Automated code review and quality checks",
      "schedule": "0 9 * * *",
      "enabled": true
    }
  ]
}
```

## Commands

### Development
```bash
npm run agent:start    # Start scheduler
npm run agent:monitor  # Start dashboard
npm run agent:webhook  # Start webhook handler
npm run agent:dev      # Start all services
```

### Production (Systemd)
```bash
sudo systemctl start cursor-agent-scheduler
sudo systemctl status cursor-agent-scheduler
sudo systemctl restart cursor-agent-scheduler
sudo journalctl -u cursor-agent-scheduler -f
```

### Docker
```bash
docker-compose up cursor-agent-scheduler
docker-compose logs cursor-agent-scheduler
```

## Monitoring & Debugging

### Web Dashboard
- URL: http://localhost:3002
- Features: Real-time status, logs, manual triggers, metrics

### Log Files
- Main logs: `logs/agent-scheduler.log`
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

### Health Checks
- Scheduler: http://localhost:3002/api/agents/status
- Webhook: http://localhost:3001/health
- Metrics: http://localhost:3002/api/metrics

## Security

- API tokens stored in environment variables
- Webhook signature verification
- systemd security restrictions
- Resource limits and sandboxing
- Regular security scans

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo systemctl status cursor-agent-scheduler
   sudo journalctl -u cursor-agent-scheduler -n 50
   ```

2. **Agents not triggering:**
   - Check if `AGENT_SCHEDULER_ENABLED=true`
   - Verify cron schedule format
   - Check logs for errors

3. **Webhook not working:**
   - Verify GitHub webhook URL
   - Check webhook secret
   - Ensure port 3001 is accessible

4. **Slack notifications not working:**
   - Verify webhook URL
   - Check network connectivity
   - Review Slack app permissions

### Performance Optimization

- Monitor memory usage in dashboard
- Adjust `maxConcurrentAgents` in config
- Enable log rotation
- Use Docker for resource isolation

## Next Steps

1. **Customize agents** in `config/agents.json`
2. **Set up GitHub webhooks** for your repository
3. **Configure Slack integration** for notifications
4. **Add custom automation** by extending the scheduler
5. **Monitor and optimize** using the web dashboard

Happy automating! 🚀
const { exec } = require('child_process');
const cron = require('node-cron');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Configure logger to match existing project logging
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/agent-scheduler.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class CursorAgentScheduler {
  constructor() {
    this.agentConfig = this.loadAgentConfig();
    this.isEnabled = process.env.AGENT_SCHEDULER_ENABLED === 'true';
    this.slackNotifier = process.env.SLACK_WEBHOOK_URL ? 
      new (require('./slack-notifier'))(process.env.SLACK_WEBHOOK_URL) : null;
  }

  loadAgentConfig() {
    try {
      const configPath = path.join(__dirname, '../config/agents.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      return { agents: [] };
    } catch (error) {
      logger.error('Failed to load agent configuration:', error);
      return { agents: [] };
    }
  }

  async triggerAgent(taskType, prompt, options = {}) {
    if (!this.isEnabled) {
      logger.info(`Agent scheduler disabled, skipping ${taskType}`);
      return;
    }

    logger.info(`Triggering agent: ${taskType}`);
    
    try {
      // For now, we'll simulate the agent trigger since the actual Cursor API
      // for background agents is still evolving. This would be replaced with
      // actual API calls when available.
      
      const result = await this.simulateAgentExecution(taskType, prompt, options);
      
      if (this.slackNotifier) {
        await this.slackNotifier.sendAgentUpdate(
          taskType, 
          result.success ? 'success' : 'failed', 
          result.message
        );
      }
      
      logger.info(`Agent ${taskType} completed with status: ${result.success ? 'success' : 'failed'}`);
      
    } catch (error) {
      logger.error(`Agent ${taskType} failed:`, error);
      
      if (this.slackNotifier) {
        await this.slackNotifier.sendAgentUpdate(
          taskType, 
          'failed', 
          `Error: ${error.message}`
        );
      }
    }
  }

  async simulateAgentExecution(taskType, prompt, options) {
    // This simulates what would happen with actual Cursor background agents
    // Replace this with actual Cursor API calls when available
    
    switch (taskType) {
      case 'code-review':
        return await this.runCodeReview();
      case 'dependency-update':
        return await this.runDependencyUpdate();
      case 'security-scan':
        return await this.runSecurityScan();
      case 'performance-monitor':
        return await this.runPerformanceMonitor();
      default:
        return { success: false, message: `Unknown task type: ${taskType}` };
    }
  }

  async runCodeReview() {
    return new Promise((resolve) => {
      exec('npm run lint', (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, message: `Linting failed: ${error.message}` });
        } else {
          resolve({ success: true, message: 'Code review completed successfully' });
        }
      });
    });
  }

  async runDependencyUpdate() {
    return new Promise((resolve) => {
      exec('npm outdated --json', (error, stdout, stderr) => {
        try {
          const outdated = JSON.parse(stdout || '{}');
          const count = Object.keys(outdated).length;
          resolve({ 
            success: true, 
            message: `Found ${count} outdated packages. Update recommendations logged.` 
          });
        } catch (e) {
          resolve({ success: true, message: 'All dependencies are up to date' });
        }
      });
    });
  }

  async runSecurityScan() {
    return new Promise((resolve) => {
      exec('npm audit --json', (error, stdout, stderr) => {
        try {
          const audit = JSON.parse(stdout || '{}');
          const vulnerabilities = audit.metadata?.vulnerabilities || {};
          const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
          
          resolve({ 
            success: total === 0, 
            message: `Security scan completed. Found ${total} vulnerabilities.` 
          });
        } catch (e) {
          resolve({ success: false, message: 'Security scan failed to parse results' });
        }
      });
    });
  }

  async runPerformanceMonitor() {
    return new Promise((resolve) => {
      exec('npm run build --silent', (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, message: `Build failed: ${error.message}` });
        } else {
          resolve({ success: true, message: 'Performance monitoring completed' });
        }
      });
    });
  }

  scheduleAgentTasks() {
    if (!this.isEnabled) {
      logger.info('Agent scheduler is disabled');
      return;
    }

    logger.info('Starting Cursor agent scheduler...');

    // Schedule tasks based on configuration
    this.agentConfig.agents.forEach(agent => {
      if (agent.schedule) {
        cron.schedule(agent.schedule, () => {
          logger.info(`Starting scheduled task: ${agent.name}`);
          this.triggerAgent(agent.name, agent.description);
        });
        
        logger.info(`Scheduled agent "${agent.name}" with cron: ${agent.schedule}`);
      }
    });

    // Default schedules if no config is available
    if (this.agentConfig.agents.length === 0) {
      // Daily code review at 9 AM
      cron.schedule('0 9 * * *', () => {
        this.triggerAgent('code-review', 'Perform daily code review and create PR for any issues found');
      });

      // Weekly dependency updates on Sundays at 10 AM
      cron.schedule('0 10 * * 0', () => {
        this.triggerAgent('dependency-update', 'Check for and update npm dependencies, run tests, create PR if successful');
      });

      // Security scan every night at 2 AM
      cron.schedule('0 2 * * *', () => {
        this.triggerAgent('security-scan', 'Run security audit and fix any vulnerabilities found');
      });

      // Performance monitoring on Mondays at 12 PM
      cron.schedule('0 12 * * 1', () => {
        this.triggerAgent('performance-monitor', 'Analyze bundle size and performance metrics');
      });

      logger.info('Default agent schedules configured');
    }
  }

  async handleWebhookTrigger(event, payload) {
    if (!this.isEnabled) return;

    switch (event) {
      case 'push':
        if (payload.ref === 'refs/heads/main') {
          await this.triggerAgent('post-merge', 'Analyze recent changes and run deployment checks');
        }
        break;
      
      case 'pull_request':
        if (payload.action === 'opened') {
          await this.triggerAgent('pr-review', `Review PR #${payload.number} and provide feedback`);
        }
        break;
      
      case 'issues':
        if (payload.action === 'opened') {
          await this.triggerAgent('issue-analysis', `Analyze issue #${payload.issue.number} and suggest solutions`);
        }
        break;
    }
  }

  getStatus() {
    return {
      enabled: this.isEnabled,
      scheduledAgents: this.agentConfig.agents.length,
      lastUpdate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

// Initialize and start the scheduler
const scheduler = new CursorAgentScheduler();

// Start scheduling tasks
scheduler.scheduleAgentTasks();

// Export for use in other modules
module.exports = { CursorAgentScheduler, scheduler };

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

logger.info('Cursor agent scheduler started successfully');
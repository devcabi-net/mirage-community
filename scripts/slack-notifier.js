const axios = require('axios');
const { logger } = require('./logger');

class SlackNotifier {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.isEnabled = !!webhookUrl;
  }

  async sendAgentUpdate(agentName, status, details) {
    if (!this.isEnabled) {
      return;
    }

    const color = this.getStatusColor(status);
    const emoji = this.getStatusEmoji(status);
    
    const message = {
      text: `${emoji} Agent Update: ${agentName}`,
      attachments: [
        {
          color: color,
          fields: [
            {
              title: 'Status',
              value: status.toUpperCase(),
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
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            }
          ],
          footer: 'Mirage Community Agent System',
          footer_icon: 'https://themirage.xxx/favicon.ico'
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, message);
      logger.info(`Slack notification sent for agent ${agentName}`);
    } catch (error) {
      logger.error('Failed to send Slack notification:', error);
    }
  }

  async sendSystemAlert(level, title, message) {
    if (!this.isEnabled) {
      return;
    }

    const color = this.getAlertColor(level);
    const emoji = this.getAlertEmoji(level);

    const slackMessage = {
      text: `${emoji} System Alert: ${title}`,
      attachments: [
        {
          color: color,
          fields: [
            {
              title: 'Level',
              value: level.toUpperCase(),
              short: true
            },
            {
              title: 'System',
              value: 'Mirage Community',
              short: true
            },
            {
              title: 'Message',
              value: message,
              short: false
            }
          ],
          footer: 'Mirage Community Monitoring',
          footer_icon: 'https://themirage.xxx/favicon.ico'
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, slackMessage);
      logger.info(`System alert sent to Slack: ${level} - ${title}`);
    } catch (error) {
      logger.error('Failed to send system alert to Slack:', error);
    }
  }

  async sendDeploymentNotification(status, details) {
    if (!this.isEnabled) {
      return;
    }

    const color = status === 'success' ? 'good' : 'danger';
    const emoji = status === 'success' ? '🚀' : '💥';

    const message = {
      text: `${emoji} Deployment ${status.toUpperCase()}`,
      attachments: [
        {
          color: color,
          fields: [
            {
              title: 'Status',
              value: status.toUpperCase(),
              short: true
            },
            {
              title: 'Project',
              value: 'Mirage Community',
              short: true
            },
            {
              title: 'Details',
              value: details,
              short: false
            }
          ],
          footer: 'Mirage Community Deployment',
          footer_icon: 'https://themirage.xxx/favicon.ico'
        }
      ]
    };

    try {
      await axios.post(this.webhookUrl, message);
      logger.info(`Deployment notification sent to Slack: ${status}`);
    } catch (error) {
      logger.error('Failed to send deployment notification to Slack:', error);
    }
  }

  getStatusColor(status) {
    const colors = {
      'success': 'good',
      'failed': 'danger',
      'warning': 'warning',
      'info': '#36a64f',
      'running': '#439FE0'
    };
    return colors[status] || '#36a64f';
  }

  getStatusEmoji(status) {
    const emojis = {
      'success': '✅',
      'failed': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'running': '🏃‍♂️'
    };
    return emojis[status] || 'ℹ️';
  }

  getAlertColor(level) {
    const colors = {
      'critical': 'danger',
      'error': 'danger',
      'warning': 'warning',
      'info': 'good'
    };
    return colors[level] || 'good';
  }

  getAlertEmoji(level) {
    const emojis = {
      'critical': '🚨',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return emojis[level] || 'ℹ️';
  }
}

module.exports = SlackNotifier;
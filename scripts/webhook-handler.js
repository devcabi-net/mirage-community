const express = require('express');
const crypto = require('crypto');
const { scheduler } = require('./agent-scheduler');
const { logger } = require('./logger');

const app = express();
const port = process.env.WEBHOOK_PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// Webhook signature verification
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  
  if (!signature || !secret) {
    return res.status(401).json({ error: 'Missing signature or secret' });
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// GitHub webhook handler
app.post('/webhook/github', verifyWebhookSignature, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  logger.info(`Received GitHub webhook: ${event}`, { 
    action: payload.action,
    repository: payload.repository?.name 
  });

  try {
    await scheduler.handleWebhookTrigger(event, payload);
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webhook-handler'
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    ...scheduler.getStatus(),
    webhook: {
      port: port,
      endpoints: ['/webhook/github', '/health', '/status']
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Webhook handler error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
  logger.info(`Webhook handler listening on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Webhook handler shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Webhook handler shutting down...');
  process.exit(0);
});

module.exports = app;
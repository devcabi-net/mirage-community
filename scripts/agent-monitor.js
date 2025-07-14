const express = require('express');
const fs = require('fs');
const path = require('path');
const { scheduler } = require('./agent-scheduler');
const { logger } = require('./logger');

const app = express();
const port = process.env.MONITOR_PORT || 3002;

// Serve static files for dashboard
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get agent status
app.get('/api/agents/status', (req, res) => {
  try {
    const status = scheduler.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Failed to get agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

// API endpoint to get recent logs
app.get('/api/logs', (req, res) => {
  const logFile = path.join(__dirname, '../logs/agent-scheduler.log');
  const limit = parseInt(req.query.limit) || 100;
  
  try {
    if (!fs.existsSync(logFile)) {
      return res.json({ logs: [] });
    }

    const logs = fs.readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });

    res.json({ logs });
  } catch (error) {
    logger.error('Failed to read logs:', error);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

// API endpoint to get system metrics
app.get('/api/metrics', (req, res) => {
  try {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({ error: 'Failed to get system metrics' });
  }
});

// API endpoint to trigger agent manually
app.post('/api/agents/trigger', express.json(), async (req, res) => {
  const { agentName, prompt } = req.body;

  if (!agentName || !prompt) {
    return res.status(400).json({ error: 'Agent name and prompt are required' });
  }

  try {
    await scheduler.triggerAgent(agentName, prompt);
    res.json({ message: `Agent ${agentName} triggered successfully` });
  } catch (error) {
    logger.error('Failed to trigger agent:', error);
    res.status(500).json({ error: 'Failed to trigger agent' });
  }
});

// Dashboard HTML
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Agent Monitor - Mirage Community</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-running { background: #4CAF50; }
        .status-stopped { background: #f44336; }
        .log-entry {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 12px;
        }
        .log-error { color: #f44336; }
        .log-info { color: #2196F3; }
        .log-warn { color: #ff9800; }
        .btn {
            background: #2196F3;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 4px;
        }
        .btn:hover { background: #1976D2; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; display: inline-block; width: 100px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Cursor Agent Monitor</h1>
            <p>Mirage Community - Real-time agent monitoring dashboard</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>Agent Status</h3>
                <div id="agent-status">Loading...</div>
            </div>

            <div class="card">
                <h3>System Metrics</h3>
                <div id="system-metrics">Loading...</div>
            </div>

            <div class="card">
                <h3>Manual Trigger</h3>
                <form id="trigger-form">
                    <select id="agent-select">
                        <option value="code-review">Code Review</option>
                        <option value="dependency-update">Dependency Update</option>
                        <option value="security-scan">Security Scan</option>
                        <option value="performance-monitor">Performance Monitor</option>
                    </select>
                    <input type="text" id="prompt-input" placeholder="Enter prompt..." style="width: 100%; margin: 10px 0; padding: 8px;">
                    <button type="submit" class="btn">Trigger Agent</button>
                </form>
            </div>

            <div class="card" style="grid-column: 1 / -1;">
                <h3>Recent Logs</h3>
                <div id="logs-container" style="max-height: 400px; overflow-y: auto;">
                    Loading logs...
                </div>
                <button onclick="refreshLogs()" class="btn">Refresh Logs</button>
            </div>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setInterval(refreshAll, 30000);

        async function refreshAll() {
            await Promise.all([
                refreshStatus(),
                refreshMetrics(),
                refreshLogs()
            ]);
        }

        async function refreshStatus() {
            try {
                const response = await fetch('/api/agents/status');
                const data = await response.json();
                
                const statusHtml = \`
                    <div class="metric">
                        <span class="metric-label">Status:</span>
                        <span class="status-indicator \${data.enabled ? 'status-running' : 'status-stopped'}"></span>
                        \${data.enabled ? 'Running' : 'Stopped'}
                    </div>
                    <div class="metric">
                        <span class="metric-label">Agents:</span>
                        \${data.scheduledAgents} scheduled
                    </div>
                    <div class="metric">
                        <span class="metric-label">Environment:</span>
                        \${data.environment}
                    </div>
                    <div class="metric">
                        <span class="metric-label">Last Update:</span>
                        \${new Date(data.lastUpdate).toLocaleString()}
                    </div>
                \`;
                
                document.getElementById('agent-status').innerHTML = statusHtml;
            } catch (error) {
                document.getElementById('agent-status').innerHTML = 'Error loading status';
            }
        }

        async function refreshMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                const metricsHtml = \`
                    <div class="metric">
                        <span class="metric-label">Uptime:</span>
                        \${Math.floor(data.uptime / 60)} minutes
                    </div>
                    <div class="metric">
                        <span class="metric-label">Memory:</span>
                        \${Math.round(data.memory.heapUsed / 1024 / 1024)} MB
                    </div>
                    <div class="metric">
                        <span class="metric-label">CPU:</span>
                        \${Math.round(data.cpu.user / 1000)} ms
                    </div>
                \`;
                
                document.getElementById('system-metrics').innerHTML = metricsHtml;
            } catch (error) {
                document.getElementById('system-metrics').innerHTML = 'Error loading metrics';
            }
        }

        async function refreshLogs() {
            try {
                const response = await fetch('/api/logs?limit=50');
                const data = await response.json();
                
                const logsHtml = data.logs.map(log => \`
                    <div class="log-entry log-\${log.level || 'info'}">
                        <strong>\${new Date(log.timestamp).toLocaleTimeString()}</strong>
                        \${log.message}
                    </div>
                \`).join('');
                
                document.getElementById('logs-container').innerHTML = logsHtml;
            } catch (error) {
                document.getElementById('logs-container').innerHTML = 'Error loading logs';
            }
        }

        // Manual trigger form
        document.getElementById('trigger-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const agentName = document.getElementById('agent-select').value;
            const prompt = document.getElementById('prompt-input').value;
            
            if (!prompt) {
                alert('Please enter a prompt');
                return;
            }

            try {
                const response = await fetch('/api/agents/trigger', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ agentName, prompt }),
                });
                
                const result = await response.json();
                alert(result.message || 'Agent triggered successfully');
                
                // Clear form
                document.getElementById('prompt-input').value = '';
                
                // Refresh logs
                setTimeout(refreshLogs, 2000);
            } catch (error) {
                alert('Failed to trigger agent');
            }
        });

        // Initial load
        refreshAll();
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Start the server
app.listen(port, () => {
  logger.info(`Agent monitor dashboard listening on port ${port}`);
  logger.info(`Dashboard available at: http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Agent monitor shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Agent monitor shutting down...');
  process.exit(0);
});

module.exports = app;
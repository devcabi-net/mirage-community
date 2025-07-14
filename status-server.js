const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const net = require('net');

const PORT = 8080;

// Service status checking functions
async function checkService(host, port, timeout = 5000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const client = net.createConnection({ host, port });
        
        const timeoutId = setTimeout(() => {
            client.destroy();
            resolve({
                status: 'unhealthy',
                responseTime: Date.now() - start,
                details: 'Connection timeout'
            });
        }, timeout);
        
        client.on('connect', () => {
            clearTimeout(timeoutId);
            client.end();
            resolve({
                status: 'healthy',
                responseTime: Date.now() - start,
                details: 'Connection successful'
            });
        });
        
        client.on('error', (error) => {
            clearTimeout(timeoutId);
            resolve({
                status: 'unhealthy',
                responseTime: Date.now() - start,
                details: error.message
            });
        });
    });
}

async function checkFileSystem(paths) {
    const start = Date.now();
    try {
        for (const checkPath of paths) {
            await fs.promises.access(checkPath);
        }
        return {
            status: 'healthy',
            responseTime: Date.now() - start,
            details: 'All directories accessible'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            responseTime: Date.now() - start,
            details: error.message
        };
    }
}

async function checkDockerService(serviceName) {
    const start = Date.now();
    return new Promise((resolve) => {
        exec(`docker ps --filter "name=${serviceName}" --format "table {{.Names}}\t{{.Status}}"`, (error, stdout) => {
            const responseTime = Date.now() - start;
            if (error) {
                resolve({
                    status: 'unhealthy',
                    responseTime,
                    details: `Docker check failed: ${error.message}`
                });
                return;
            }
            
            const lines = stdout.trim().split('\n');
            if (lines.length > 1 && lines[1].includes('Up')) {
                resolve({
                    status: 'healthy',
                    responseTime,
                    details: 'Docker container is running'
                });
            } else {
                resolve({
                    status: 'unhealthy',
                    responseTime,
                    details: 'Docker container not found or not running'
                });
            }
        });
    });
}

async function checkWebApp() {
    const start = Date.now();
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            resolve({
                status: 'healthy',
                responseTime: Date.now() - start,
                details: `HTTP ${res.statusCode} - Web app responding`
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 'unhealthy',
                responseTime: Date.now() - start,
                details: error.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                status: 'unhealthy',
                responseTime: Date.now() - start,
                details: 'Request timeout'
            });
        });
        
        req.end();
    });
}

async function getSystemStatus() {
    const checks = await Promise.all([
        checkWebApp(),
        checkService('localhost', 5432), // PostgreSQL
        checkService('localhost', 6379), // Redis
        checkDockerService('mirage_bot'), // Discord Bot
        checkFileSystem(['./uploads', './logs']),
        checkService('localhost', 80) // Nginx
    ]);
    
    const services = [
        {
            name: 'Next.js Web Application',
            ...checks[0],
            lastCheck: new Date().toISOString()
        },
        {
            name: 'PostgreSQL Database',
            ...checks[1],
            lastCheck: new Date().toISOString()
        },
        {
            name: 'Redis Cache',
            ...checks[2],
            lastCheck: new Date().toISOString()
        },
        {
            name: 'Discord Bot',
            ...checks[3],
            lastCheck: new Date().toISOString()
        },
        {
            name: 'File System',
            ...checks[4],
            lastCheck: new Date().toISOString()
        },
        {
            name: 'Nginx Reverse Proxy',
            ...checks[5],
            lastCheck: new Date().toISOString()
        }
    ];
    
    // Calculate overall status
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalCount = services.length;
    
    let overall;
    if (healthyCount === totalCount) {
        overall = 'healthy';
    } else if (healthyCount > totalCount / 2) {
        overall = 'degraded';
    } else {
        overall = 'unhealthy';
    }
    
    return {
        overall,
        services,
        timestamp: new Date().toISOString()
    };
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    try {
        if (url.pathname === '/') {
            // Serve the dashboard HTML
            const html = await fs.promises.readFile('status-dashboard.html', 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } else if (url.pathname === '/api/status') {
            // Serve status API
            const status = await getSystemStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status, null, 2));
        } else {
            // 404 for other paths
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'Internal server error',
            message: error.message
        }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Status Dashboard running at:`);
    console.log(`   Local:            http://localhost:${PORT}`);
    console.log(`   Status API:       http://localhost:${PORT}/api/status`);
    console.log(`\n💡 The dashboard will automatically refresh every 30 seconds`);
    console.log(`   No authentication required - public monitoring dashboard`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down status dashboard...');
    server.close(() => {
        console.log('✅ Status dashboard stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down status dashboard...');
    server.close(() => {
        console.log('✅ Status dashboard stopped');
        process.exit(0);
    });
});
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as net from 'net';

const prisma = new PrismaClient();

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime?: string;
  lastCheck: string;
  details?: string;
  responseTime?: number;
}

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceStatus[];
  timestamp: string;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    return {
      name: 'PostgreSQL Database',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime,
      details: 'Database connection successful'
    };
  } catch (error) {
    return {
      name: 'PostgreSQL Database',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple Redis connection check using net module
    const url = new URL(process.env.REDIS_URL || 'redis://localhost:6379');
    
    return new Promise((resolve) => {
      const client = net.createConnection({
        host: url.hostname,
        port: parseInt(url.port) || 6379
      });
      
      client.on('connect', () => {
        client.end();
        const responseTime = Date.now() - start;
        resolve({
          name: 'Redis Cache',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime,
          details: 'Redis connection successful'
        });
      });
      
      client.on('error', (error: any) => {
        const responseTime = Date.now() - start;
        resolve({
          name: 'Redis Cache',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime,
          details: error.message || 'Redis connection failed'
        });
      });
      
      // Set timeout
      setTimeout(() => {
        client.destroy();
        resolve({
          name: 'Redis Cache',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime: Date.now() - start,
          details: 'Redis connection timeout'
        });
      }, 5000);
    });
  } catch (error) {
    return {
      name: 'Redis Cache',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
}

async function checkDiscordBot(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Check if bot process is running by looking for recent logs or health endpoint
    // This is a simplified check - in production you might want a dedicated health endpoint
    const botHealthy = process.env.DISCORD_BOT_TOKEN ? true : false;
    const responseTime = Date.now() - start;
    
    return {
      name: 'Discord Bot',
      status: botHealthy ? 'healthy' : 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime,
      details: botHealthy ? 'Bot token configured' : 'Bot token missing'
    };
  } catch (error) {
    return {
      name: 'Discord Bot',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Bot status check failed'
    };
  }
}

async function checkWebApp(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Self-check of the Next.js application
    const responseTime = Date.now() - start;
    return {
      name: 'Next.js Web Application',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime,
      uptime: process.uptime() ? `${Math.floor(process.uptime())}s` : undefined,
      details: 'Application is running'
    };
  } catch (error) {
    return {
      name: 'Next.js Web Application',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'Application check failed'
    };
  }
}

async function checkFileSystem(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const fs = require('fs').promises;
    await fs.access('./uploads');
    await fs.access('./logs');
    const responseTime = Date.now() - start;
    return {
      name: 'File System',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime,
      details: 'Upload and log directories accessible'
    };
  } catch (error) {
    return {
      name: 'File System',
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - start,
      details: error instanceof Error ? error.message : 'File system check failed'
    };
  }
}

export async function GET() {
  try {
    const serviceChecks = await Promise.all([
      checkWebApp(),
      checkDatabase(),
      checkRedis(),
      checkDiscordBot(),
      checkFileSystem()
    ]);

    // Determine overall system status
    const healthyCount = serviceChecks.filter(s => s.status === 'healthy').length;
    const totalCount = serviceChecks.length;
    
    let overall: SystemStatus['overall'];
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount > totalCount / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const systemStatus: SystemStatus = {
      overall,
      services: serviceChecks,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(systemStatus);
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json(
      {
        overall: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Status check failed'
      },
      { status: 500 }
    );
  }
}
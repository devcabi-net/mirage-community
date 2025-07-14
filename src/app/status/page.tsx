'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Clock, Activity } from 'lucide-react';

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
  error?: string;
}

const StatusBadge = ({ status }: { status: ServiceStatus['status'] }) => {
  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', text: 'Healthy' },
    unhealthy: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', text: 'Unhealthy' },
    unknown: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', text: 'Unknown' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};

const ServiceCard = ({ service }: { service: ServiceStatus }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        {service.responseTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Response time: {service.responseTime}ms</span>
          </div>
        )}
        
        {service.uptime && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Uptime: {service.uptime}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Last checked: {new Date(service.lastCheck).toLocaleString()}</span>
        </div>
        
        {service.details && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{service.details}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const OverallStatus = ({ overall }: { overall: SystemStatus['overall'] }) => {
  const statusConfig = {
    healthy: { 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-200',
      text: 'All Systems Operational',
      description: 'All services are running normally'
    },
    degraded: { 
      icon: AlertCircle, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      text: 'Degraded Performance',
      description: 'Some services are experiencing issues'
    },
    unhealthy: { 
      icon: XCircle, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-200',
      text: 'Major Outage',
      description: 'Multiple services are down'
    }
  };

  const config = statusConfig[overall];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border-2 rounded-lg p-6 mb-8`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-8 h-8 ${config.color}`} />
        <div>
          <h2 className={`text-2xl font-bold ${config.color}`}>{config.text}</h2>
          <p className="text-gray-600">{config.description}</p>
        </div>
      </div>
    </div>
  );
};

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setStatus({
        overall: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Unavailable</h1>
          <p className="text-gray-600">Unable to fetch system status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">System Status</h1>
          <p className="text-gray-600">Real-time monitoring of all project services</p>
        </div>

        <OverallStatus overall={status.overall} />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Service Status</h2>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </span>
            )}
            <button
              onClick={fetchStatus}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {status.services.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>

        {status.error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-700">Error</span>
            </div>
            <p className="text-red-600 mt-1">{status.error}</p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This dashboard automatically refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}
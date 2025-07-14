# System Status Dashboard

A comprehensive, real-time monitoring dashboard for all project services that requires no authentication and provides instant visibility into system health.

## 🚀 Features

- **Real-time Monitoring**: Automatically refreshes every 30 seconds
- **No Authentication Required**: Public-facing dashboard for instant access
- **Comprehensive Service Coverage**: Monitors all critical project components
- **Beautiful UI**: Modern, responsive design that works on all devices
- **Service Health Indicators**: Visual status badges with response times
- **Overall System Health**: At-a-glance system status overview
- **Error Handling**: Graceful fallbacks when services are unavailable

## 📊 Monitored Services

The dashboard monitors the following services:

### 1. **Next.js Web Application**
- **Port**: 3000
- **Check**: HTTP health check to localhost:3000
- **Status**: Response time and HTTP status code

### 2. **PostgreSQL Database**
- **Port**: 5432
- **Check**: TCP connection test
- **Status**: Connection success/failure and response time

### 3. **Redis Cache**
- **Port**: 6379
- **Check**: TCP connection test
- **Status**: Connection success/failure and response time

### 4. **Discord Bot**
- **Check**: Docker container status (`mirage_bot`)
- **Status**: Container running state and uptime

### 5. **File System**
- **Check**: Directory accessibility (`./uploads`, `./logs`)
- **Status**: File system mount and permissions

### 6. **Nginx Reverse Proxy**
- **Port**: 80
- **Check**: TCP connection test
- **Status**: Proxy server availability

## 🛠️ Setup & Usage

### Quick Start

1. **Start the Status Dashboard:**
   ```bash
   node status-server.js
   ```

2. **Access the Dashboard:**
   - **Web Interface**: http://localhost:8080
   - **API Endpoint**: http://localhost:8080/api/status

3. **View Status:**
   - The dashboard automatically refreshes every 30 seconds
   - Click "Refresh" for immediate updates
   - No login required

### Alternative Setup

You can also serve the dashboard directly as a static file:

```bash
# Serve using Python (if available)
python3 -m http.server 8080

# Or using Node.js http-server
npx http-server -p 8080
```

Then open `status-dashboard.html` in your browser.

### Docker Integration

Add this to your `docker-compose.yml` to run the status dashboard as a service:

```yaml
status-dashboard:
  build:
    context: .
    dockerfile: Dockerfile.status
  container_name: mirage_status
  restart: unless-stopped
  ports:
    - "8080:8080"
  depends_on:
    - postgres
    - redis
    - app
    - bot
  volumes:
    - ./uploads:/app/uploads:ro
    - ./logs:/app/logs:ro
  command: node status-server.js
```

## 🔧 Configuration

### Environment Variables

The status dashboard can be configured with these environment variables:

- `STATUS_PORT`: Port for the status server (default: 8080)
- `CHECK_INTERVAL`: Status check interval in seconds (default: 30)
- `TIMEOUT`: Service check timeout in milliseconds (default: 5000)

### Service Customization

To add or modify monitored services, edit the `getSystemStatus()` function in `status-server.js`:

```javascript
const checks = await Promise.all([
    checkWebApp(),
    checkService('localhost', 5432), // PostgreSQL
    checkService('localhost', 6379), // Redis
    checkDockerService('mirage_bot'), // Discord Bot
    checkFileSystem(['./uploads', './logs']),
    checkService('localhost', 80), // Nginx
    // Add your custom checks here
]);
```

## 📡 API Reference

### GET `/api/status`

Returns comprehensive system status in JSON format.

**Response Format:**
```json
{
  "overall": "healthy|degraded|unhealthy",
  "services": [
    {
      "name": "Service Name",
      "status": "healthy|unhealthy|unknown",
      "responseTime": 123,
      "lastCheck": "2025-01-14T10:30:00.000Z",
      "details": "Status description"
    }
  ],
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

**Overall Status Logic:**
- `healthy`: All services are operational
- `degraded`: More than half of services are operational
- `unhealthy`: Less than half of services are operational

## 🎨 Customization

### Styling

The dashboard uses modern CSS with a clean, professional design. To customize:

1. **Colors**: Modify the CSS variables in `status-dashboard.html`
2. **Layout**: Adjust the grid layout and spacing
3. **Branding**: Add your logo and company colors

### Adding New Services

To monitor additional services:

1. **Add Service Check Function:**
   ```javascript
   async function checkCustomService() {
       // Your custom check logic
       return {
           status: 'healthy|unhealthy',
           responseTime: 123,
           details: 'Status description'
       };
   }
   ```

2. **Add to Status Checks:**
   ```javascript
   const checks = await Promise.all([
       // ... existing checks
       checkCustomService()
   ]);
   ```

3. **Add to Services Array:**
   ```javascript
   const services = [
       // ... existing services
       {
           name: 'Custom Service',
           ...checks[newIndex],
           lastCheck: new Date().toISOString()
       }
   ];
   ```

## 🔒 Security Considerations

- **No Authentication**: Dashboard is public by design for monitoring
- **Read-Only**: Dashboard only reads system status, no write operations
- **Local Network**: Recommended for internal network use only
- **Rate Limiting**: Consider adding rate limiting for production use

## 🚨 Troubleshooting

### Common Issues

1. **Services Show as Unhealthy:**
   - Check if the service is actually running
   - Verify port numbers match your configuration
   - Ensure Docker containers are started

2. **API Errors:**
   - Check if `status-server.js` is running
   - Verify port 8080 is available
   - Check console for error messages

3. **Dashboard Not Loading:**
   - Ensure both `status-dashboard.html` and `status-server.js` are in the same directory
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=status-dashboard
node status-server.js
```

## 🎯 Production Deployment

For production use:

1. **Process Management:**
   ```bash
   # Using PM2
   pm2 start status-server.js --name status-dashboard
   
   # Using systemd
   sudo systemctl enable status-dashboard
   sudo systemctl start status-dashboard
   ```

2. **Reverse Proxy:**
   ```nginx
   location /status {
       proxy_pass http://localhost:8080;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

3. **Monitoring:**
   - Set up alerts for when the dashboard itself goes down
   - Monitor response times and availability
   - Log status changes for historical analysis

## 📈 Future Enhancements

- **Historical Data**: Store and display service uptime history
- **Alerts**: Email/Slack notifications for service failures
- **Metrics**: Detailed performance metrics and graphs
- **Mobile App**: Native mobile application for monitoring
- **Multi-Environment**: Support for dev/staging/production environments

## 🤝 Contributing

To contribute to the status dashboard:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This status dashboard is part of the larger project and follows the same license terms.

---

**Need Help?** Check the troubleshooting section or create an issue in the project repository.
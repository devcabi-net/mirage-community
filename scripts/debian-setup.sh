#!/bin/bash
set -e

# The Mirage Community - Debian 12 (Bookworm) Setup Script
# This script configures a fresh Debian 12 VPS for hosting the application

echo "==================================="
echo "The Mirage Community Setup Script"
echo "==================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root"
   exit 1
fi

# Variables
DOMAIN="themirage.xxx"
USER="linuxuser"
NODE_VERSION="18"
POSTGRES_VERSION="15"

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
echo "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    vim \
    tmux \
    unzip

# Install Node.js via NodeSource
echo "Installing Node.js ${NODE_VERSION}..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs

# Verify Node installation
node --version
npm --version

# Install PostgreSQL
echo "Installing PostgreSQL ${POSTGRES_VERSION}..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-${POSTGRES_VERSION} postgresql-client-${POSTGRES_VERSION}

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER mirage_user WITH PASSWORD 'changeme_in_production';
CREATE DATABASE mirage_community OWNER mirage_user;
GRANT ALL PRIVILEGES ON DATABASE mirage_community TO mirage_user;
EOF

# Install Nginx
echo "Installing Nginx..."
apt install -y nginx

# Install Certbot
echo "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install Redis (optional but recommended)
echo "Installing Redis..."
apt install -y redis-server
systemctl enable redis-server

# Configure UFW firewall
echo "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 2222/tcp  # SFTP
ufw --force enable

# Configure Fail2Ban
echo "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

systemctl restart fail2ban

# Create application directories
echo "Creating application directories..."
mkdir -p /var/www/uploads
mkdir -p /var/www/certbot
mkdir -p /home/${USER}/mirage-community
chown -R ${USER}:${USER} /home/${USER}/mirage-community
chown -R www-data:www-data /var/www/uploads

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u ${USER} --hp /home/${USER}

# Configure SSH for SFTP
echo "Configuring SSH for SFTP..."
cat >> /etc/ssh/sshd_config <<EOF

# SFTP Configuration
Match Group sftpusers
    ChrootDirectory /var/www/uploads/%u
    ForceCommand internal-sftp
    PasswordAuthentication no
    PermitTunnel no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
EOF

# Create SFTP group
groupadd sftpusers

# Restart SSH
systemctl restart sshd

# Configure sysctl for better performance
echo "Optimizing system parameters..."
cat > /etc/sysctl.d/99-mirage.conf <<EOF
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_tw_buckets = 1440000
net.ipv4.ip_local_port_range = 1024 65000
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_max_syn_backlog = 3240000

# File system optimizations
fs.file-max = 65535
EOF

sysctl -p /etc/sysctl.d/99-mirage.conf

# Set up log rotation
echo "Configuring log rotation..."
cat > /etc/logrotate.d/mirage <<EOF
/home/${USER}/mirage-community/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0640 ${USER} ${USER}
    sharedscripts
    postrotate
        systemctl reload mirage-app >/dev/null 2>&1 || true
        systemctl reload mirage-bot >/dev/null 2>&1 || true
    endscript
}
EOF

# Install Docker (optional)
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
usermod -aG docker ${USER}

# Create swap file if not exists
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# Set up automatic security updates
echo "Configuring automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create deployment script
echo "Creating deployment helper script..."
cat > /home/${USER}/deploy.sh <<'EOF'
#!/bin/bash
cd /home/linuxuser/mirage-community
git pull origin main
npm ci --production
npm run prisma:deploy
npm run build
sudo systemctl restart mirage-app
sudo systemctl restart mirage-bot
echo "Deployment completed!"
EOF

chmod +x /home/${USER}/deploy.sh
chown ${USER}:${USER} /home/${USER}/deploy.sh

# Final instructions
echo ""
echo "==================================="
echo "Setup completed successfully!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Configure PostgreSQL password: sudo -u postgres psql -c \"ALTER USER mirage_user PASSWORD 'your_secure_password';\""
echo "2. Clone your repository: cd /home/${USER} && git clone https://github.com/yourusername/mirage-community.git"
echo "3. Configure environment variables: cp env.example .env && nano .env"
echo "4. Install dependencies: npm install"
echo "5. Run database migrations: npm run prisma:deploy"
echo "6. Build the application: npm run build"
echo "7. Copy systemd service files:"
echo "   sudo cp config/mirage-app.service /etc/systemd/system/"
echo "   sudo cp config/mirage-bot.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable mirage-app mirage-bot"
echo "   sudo systemctl start mirage-app mirage-bot"
echo "8. Configure Nginx:"
echo "   sudo cp config/nginx.conf /etc/nginx/sites-available/themirage.xxx"
echo "   sudo ln -s /etc/nginx/sites-available/themirage.xxx /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo "9. Obtain SSL certificate:"
echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo "Security reminders:"
echo "- Change the PostgreSQL password immediately"
echo "- Update SSH configuration for key-only authentication"
echo "- Review and adjust firewall rules as needed"
echo "- Set up monitoring and alerting"
echo "- Configure backups for PostgreSQL and uploads"
echo "" 
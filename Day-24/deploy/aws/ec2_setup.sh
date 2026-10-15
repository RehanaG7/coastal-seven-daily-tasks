#!/usr/bin/env bash
# ==============================================================================
# Day 24 DevOps / AWS Focus: Automated EC2 Instance Provisioning (User Data)
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS on AWS EC2 (t3.medium or t3.small)
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo "Starting Automated AWS EC2 Provisioning for R-Mart"
echo "=================================================="

# 1. Update system packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 2. Install essential dependencies, Python 3.11, Redis, Nginx, and Certbot
apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ufw \
    libpq-dev \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    redis-server \
    nginx \
    certbot \
    python3-certbot-nginx \
    amazon-cloudwatch-agent

echo "Packages successfully installed."

# 3. Configure Redis
systemctl enable redis-server
systemctl restart redis-server

# 4. Create application directories and dedicated system user
APP_DIR="/opt/rmart"
mkdir -p "$APP_DIR" "/var/log/rmart" "/etc/rmart"
chown -R ubuntu:ubuntu "$APP_DIR" "/var/log/rmart" "/etc/rmart"

# 5. Clone repository (or deploy release tarball)
cd "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
    git clone https://github.com/RehanaG7/coastal-seven-daily-tasks.git .
fi

# 6. Initialize isolated Python virtual environment
python3.11 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip setuptools wheel
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/Day-24/backend/requirements.txt"

# 7. Configure Systemd service for FastAPI
cp "$APP_DIR/Day-24/deploy/aws/rmart.service" /etc/systemd/system/rmart.service
systemctl daemon-reload
systemctl enable rmart.service
systemctl restart rmart.service

# 8. Configure Nginx Reverse Proxy
cp "$APP_DIR/Day-24/deploy/nginx/rmart_ssl.conf" /etc/nginx/sites-available/rmart.conf
ln -sf /etc/nginx/sites-available/rmart.conf /etc/nginx/sites-enabled/rmart.conf
rm -f /etc/nginx/sites-enabled/default

# Verify Nginx syntax and reload
nginx -t
systemctl restart nginx

# 9. Configure Host Firewall (UFW)
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo "=================================================="
echo "AWS EC2 Provisioning Complete! Backend is Running."
echo "=================================================="

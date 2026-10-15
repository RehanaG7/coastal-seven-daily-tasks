#!/usr/bin/env bash
# ==============================================================================
# Day 24 DevOps / AWS Focus: Automated Certbot SSL Provisioning & Auto-Renewal
# Requests free Let's Encrypt certificates and schedules daily renewal timers
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-api.rmart.store}"
EMAIL="${2:-admin@coastal-seven.com}"

echo "=================================================="
echo "Configuring HTTPS SSL Certificates for: $DOMAIN"
echo "=================================================="

# Create webroot directory for ACME challenge
mkdir -p /var/www/certbot

# Obtain certificate non-interactively
certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --keep-until-expiring

echo "SSL Certificate successfully acquired!"

# Test automatic renewal
certbot renew --dry-run

# Enable and verify Certbot systemd timer
systemctl enable certbot.timer
systemctl start certbot.timer

# Reload Nginx to load the newly active certificate
systemctl reload nginx

echo "HTTPS is active on https://$DOMAIN"

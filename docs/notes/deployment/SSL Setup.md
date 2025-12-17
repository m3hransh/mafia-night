# SSL/HTTPS Setup Guide

Complete guide for adding HTTPS to your Mafia Night deployment using Let's Encrypt.

## Overview

```
┌────────────────────────────────────────────┐
│  Browser                                   │
│    ↓ HTTPS (443) ← SSL Certificate       │
│  Nginx (Reverse Proxy)                    │
│    ↓ HTTP (internal)                      │
│  Frontend → Backend → Database            │
└────────────────────────────────────────────┘
```

## Prerequisites

- ✅ VPS deployed and running
- ✅ Domain name purchased (e.g., from Namecheap, GoDaddy, Cloudflare)
- ✅ Domain DNS configured to point to your VPS
- ✅ Ports 80 and 443 open in firewall

## Step 1: Purchase and Configure Domain

### Option A: Namecheap

1. **Purchase Domain**
   - Go to https://www.namecheap.com
   - Search for your domain
   - Purchase (typically $10-15/year)

2. **Configure DNS**
   - Go to Domain List → Manage
   - Advanced DNS tab
   - Add A Records:
     ```
     Type    Host    Value           TTL
     A       @       YOUR_VPS_IP     Automatic
     A       www     YOUR_VPS_IP     Automatic
     ```

### Option B: Cloudflare (Recommended for DDoS protection)

1. **Purchase Domain**
   - Go to https://www.cloudflare.com
   - Register Domain

2. **DNS Configuration** (automatically set up)
   - A record: `@` → `YOUR_VPS_IP`
   - A record: `www` → `YOUR_VPS_IP`

3. **Cloudflare Settings**
   - SSL/TLS → Full (strict)
   - Enable Auto HTTPS Rewrites
   - Enable Always Use HTTPS

### Option C: Other Registrars

Similar process:
- Add A record for `@` pointing to `YOUR_VPS_IP`
- Add A record for `www` pointing to `YOUR_VPS_IP`
- Wait for DNS propagation (5 min - 48 hours)

## Step 2: Verify DNS Propagation

```bash
# Check if DNS is working
ping your-domain.com

# Check DNS records
nslookup your-domain.com

# Or use online tools
# https://dnschecker.org
```

**Important**: Don't proceed until DNS is working!

## Step 3: Install Certbot on VPS

SSH into your VPS:

```bash
ssh deploy@YOUR_VPS_IP
```

### Install Certbot

```bash
# Update package list
sudo apt-get update

# Install Certbot
sudo apt-get install -y certbot

# Verify installation
certbot --version
```

## Step 4: Stop Nginx to Free Port 80

Certbot needs port 80 for verification:

```bash
# Stop nginx container
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml stop nginx
```

## Step 5: Obtain SSL Certificate

### For Single Domain

```bash
sudo certbot certonly --standalone -d your-domain.com
```

### For Domain + WWW Subdomain (Recommended)

```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### Interactive Prompts

1. **Email**: Enter your email (for renewal notices)
2. **Terms of Service**: Agree (type 'Y')
3. **Share Email**: Optional (type 'N' if you prefer)

### Success Output

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/your-domain.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/your-domain.com/privkey.pem
```

## Step 6: Copy Certificates to Project

```bash
# Create SSL directory
sudo mkdir -p /opt/mafia-night/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/mafia-night/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/mafia-night/nginx/ssl/key.pem

# Set permissions
sudo chown deploy:deploy /opt/mafia-night/nginx/ssl/*.pem
sudo chmod 644 /opt/mafia-night/nginx/ssl/cert.pem
sudo chmod 600 /opt/mafia-night/nginx/ssl/key.pem
```

## Step 7: Update Nginx Configuration

On your **local machine**, update `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Cache settings
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

    # HTTP server - redirect to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # Redirect all HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend - Next.js
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Rate limiting
            limit_req zone=general_limit burst=20 nodelay;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Rate limiting
            limit_req zone=api_limit burst=5 nodelay;

            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Static files caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            proxy_cache STATIC;
            proxy_cache_valid 200 7d;
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

**Important**: Replace `your-domain.com` with your actual domain!

## Step 8: Update Environment Variables

On your **local machine**, update `.env.production`:

```bash
# Change this line
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## Step 9: Deploy Updated Configuration

```bash
# On local machine
just deploy-prod
```

Or manually:

```bash
./scripts/deployment/deploy.sh
```

## Step 10: Verify HTTPS is Working

```bash
# Test HTTPS
curl https://your-domain.com

# Check SSL certificate
curl -vI https://your-domain.com

# Test HTTP redirect
curl -I http://your-domain.com
# Should show: 301 Moved Permanently
```

### Online SSL Test

Check your SSL configuration:
- https://www.ssllabs.com/ssltest/
- Should get A or A+ rating

## Step 11: Set Up Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# On VPS
ssh deploy@YOUR_VPS_IP

# Test renewal (dry run)
sudo certbot renew --dry-run

# Set up automatic renewal with cron
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/mafia-night/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/mafia-night/nginx/ssl/key.pem && cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart nginx"
```

Or use systemd timer (more modern):

```bash
# Enable automatic renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check status
sudo systemctl status certbot.timer
```

## Quick Setup Script

I've created a script to automate this. Create `scripts/deployment/setup-ssl.sh`:

```bash
#!/bin/bash
# Usage: ./scripts/deployment/setup-ssl.sh your-domain.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 your-domain.com"
    exit 1
fi

echo "Setting up SSL for $DOMAIN"

# SSH into VPS and run commands
ssh deploy@$DEPLOY_HOST << EOF
    # Stop nginx
    cd /opt/mafia-night
    docker-compose -f docker-compose.prod.yml stop nginx

    # Get certificate
    sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN

    # Create SSL directory
    sudo mkdir -p /opt/mafia-night/nginx/ssl

    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/mafia-night/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/mafia-night/nginx/ssl/key.pem

    # Set permissions
    sudo chown deploy:deploy /opt/mafia-night/nginx/ssl/*.pem
    sudo chmod 644 /opt/mafia-night/nginx/ssl/cert.pem
    sudo chmod 600 /opt/mafia-night/nginx/ssl/key.pem

    # Setup auto-renewal
    echo "0 0,12 * * * certbot renew --quiet --post-hook \"cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/mafia-night/nginx/ssl/cert.pem && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/mafia-night/nginx/ssl/key.pem && cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart nginx\"" | sudo crontab -

    echo "SSL setup complete!"
EOF
```

## Troubleshooting

### Certificate Not Working

```bash
# Check certificate files exist
ls -la /opt/mafia-night/nginx/ssl/

# Check certificate validity
openssl x509 -in /opt/mafia-night/nginx/ssl/cert.pem -text -noout

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx
```

### Port 80 Already in Use

```bash
# Find what's using port 80
sudo netstat -tulpn | grep :80

# Stop the service or nginx
docker-compose -f docker-compose.prod.yml stop nginx
```

### DNS Not Propagating

```bash
# Check from different locations
https://dnschecker.org

# Wait and try again later
# DNS can take up to 48 hours (usually 5-30 minutes)
```

### Certbot Verification Failed

```bash
# Make sure port 80 is accessible
curl http://your-domain.com

# Check firewall
sudo ufw status

# Make sure nginx is stopped
docker-compose -f docker-compose.prod.yml ps
```

## Security Best Practices

### SSL Configuration Checklist

- ✅ Use TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ Redirect HTTP to HTTPS
- ✅ Security headers configured
- ✅ Auto-renewal set up
- ✅ Monitor certificate expiration

### Additional Security Headers

Already included in the configuration:
- `Strict-Transport-Security`: Force HTTPS
- `X-Frame-Options`: Prevent clickjacking
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-XSS-Protection`: XSS protection
- `Referrer-Policy`: Control referrer information

## Certificate Renewal

### Manual Renewal

```bash
# On VPS
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/mafia-night/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/mafia-night/nginx/ssl/key.pem

# Restart nginx
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml restart nginx
```

### Check Renewal Status

```bash
# Check when certificates expire
sudo certbot certificates
```

## Cost

**Let's Encrypt**: FREE! 🎉
- SSL Certificates: $0/year
- Auto-renewal: FREE
- Unlimited certificates

Compare to:
- Paid SSL: $50-200/year
- Wildcard SSL: $100-300/year

## Summary

1. ✅ Purchase domain ($10-15/year)
2. ✅ Configure DNS A records
3. ✅ Wait for DNS propagation
4. ✅ Install Certbot on VPS
5. ✅ Obtain SSL certificate
6. ✅ Update nginx configuration
7. ✅ Update environment variables
8. ✅ Deploy
9. ✅ Set up auto-renewal
10. ✅ Verify HTTPS working

## Related Notes

- [[DigitalOcean Deployment]] - Initial deployment
- [[Nginx Configuration]] - Reverse proxy setup
- [[Security Best Practices]] - Hardening your VPS

---

#ssl #https #security #letsencrypt #certbot

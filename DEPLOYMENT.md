# Deployment Guide

Quick reference for deploying Mafia Night to production.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Methods](#deployment-methods)
- [Common Commands](#common-commands)
- [Documentation](#documentation)

## Quick Start

```bash
# 1. Set up VPS (one-time)
just setup-vps

# 2. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Deploy
just deploy-prod
```

## Prerequisites

### Local Machine
- [Just](https://github.com/casey/just) - Command runner
- SSH client
- Git

### DigitalOcean
- Account with payment method
- Droplet created (Ubuntu 24.04 LTS)
- SSH key added

## Initial Setup

### 1. Create DigitalOcean Droplet

**Via Dashboard:**
1. Go to https://cloud.digitalocean.com
2. Create → Droplets
3. Choose Ubuntu 24.04 LTS
4. Select plan: $12/month (2GB RAM recommended)
5. Add SSH key
6. Create droplet

**Get IP Address:**
Your droplet's IP will be displayed in the dashboard.

### 2. Set Up VPS

```bash
# Upload and run setup script
just setup-vps

# Follow prompts to enter VPS IP
# Then SSH into VPS and run:
ssh root@YOUR_VPS_IP
chmod +x /tmp/setup-vps.sh
/tmp/setup-vps.sh
```

This installs:
- Docker & Docker Compose
- Configures firewall
- Creates deploy user
- Sets up deployment directory

### 3. Add SSH Key for Deploy User

```bash
# On local machine, copy your public key
cat ~/.ssh/id_ed25519.pub

# On VPS as root
echo "YOUR_PUBLIC_KEY" | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Test access
ssh deploy@YOUR_VPS_IP
```

### 4. Configure Environment

```bash
# Copy example file
cp .env.production.example .env.production

# Edit with your values
vim .env.production
```

Required values:
- `DB_PASSWORD`: Strong database password
- `DEPLOY_HOST`: Your VPS IP
- `NEXT_PUBLIC_API_URL`: `http://YOUR_VPS_IP/api`

### 5. Configure GitHub Secrets (for CI/CD)

Go to: **Repository Settings** → **Secrets and variables** → **Actions**

Add these secrets:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `NEXT_PUBLIC_API_URL`
- `DEPLOY_USER`, `DEPLOY_HOST`, `DEPLOY_PATH`
- `SSH_PRIVATE_KEY`

See [[CI-CD Pipeline]] for details.

## Deployment Methods

### Method 1: Manual Deployment

```bash
just deploy-prod
```

What happens:
1. Validates `.env.production` exists
2. Copies files to VPS
3. Builds Docker images
4. Starts containers
5. Performs health check

### Method 2: Automated CI/CD

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

What happens:
1. GitHub Actions triggered
2. Runs tests (backend + frontend)
3. Builds Docker images
4. Deploys to VPS automatically
5. Sends deployment status

### Method 3: Manual via GitHub Actions

1. Go to **Actions** tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

## Common Commands

### Deployment

```bash
# Deploy to production
just deploy-prod

# Rollback to previous version
just rollback

# View deployment status
just status-prod
```

### Testing Production Locally

```bash
# Build production images
just build-prod

# Start production stack locally
just up-prod

# View logs
just logs-prod

# Stop stack
just down-prod
```

### Remote Operations

```bash
# SSH into production VPS
just ssh-prod

# View production logs
just logs-prod-vps

# View specific service logs
just logs-prod-vps backend
just logs-prod-vps frontend
```

### Manual SSH Commands

```bash
# Check containers
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml ps'

# View logs
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs -f'

# Restart service
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart backend'
```

## Health Checks

```bash
# Application health
curl http://YOUR_VPS_IP/health

# Frontend
curl http://YOUR_VPS_IP

# Backend API
curl http://YOUR_VPS_IP/api/health
```

## Monitoring

### Container Status

```bash
just status-prod
```

### Resource Usage

```bash
# On VPS
ssh deploy@YOUR_VPS_IP
docker stats
```

### Logs

```bash
# All services
just logs-prod-vps

# Specific service
just logs-prod-vps backend
just logs-prod-vps frontend
just logs-prod-vps postgres
```

## Troubleshooting

### Deployment Fails

```bash
# Check logs
just logs-prod-vps

# Check specific service
just logs-prod-vps backend

# SSH and debug
just ssh-prod
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml ps
```

### Database Issues

```bash
# Connect to database
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml exec postgres psql -U mafia_user -d mafia_night

# Check database logs
just logs-prod-vps postgres
```

### Container Won't Start

```bash
# Check specific container logs
just logs-prod-vps SERVICE_NAME

# Restart service
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart SERVICE_NAME'
```

## Backup & Restore

### Backup Database

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U mafia_user mafia_night > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
cat backup_YYYYMMDD.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U mafia_user mafia_night
```

## SSL/HTTPS Setup (Optional)

### With Let's Encrypt

```bash
# On VPS
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Update `nginx/nginx.conf` to use HTTPS configuration.

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
├── scripts/
│   └── deployment/
│       ├── setup-vps.sh            # VPS setup script
│       ├── deploy.sh               # Deployment script
│       └── rollback.sh             # Rollback script
├── nginx/
│   └── nginx.conf                  # Nginx configuration
├── docker-compose.prod.yml         # Production compose file
├── .env.production.example         # Environment template
└── DEPLOYMENT.md                   # This file
```

## Documentation

Detailed guides:
- [DigitalOcean Deployment](docs/notes/deployment/DigitalOcean%20Deployment.md) - Complete deployment guide
- [CI/CD Pipeline](docs/notes/deployment/CI-CD%20Pipeline.md) - Automation details
- [Docker Compose](docs/notes/tools/Docker%20Compose.md) - Container orchestration

## Security Checklist

- [ ] Strong database password
- [ ] SSH keys configured (no password auth)
- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] `.env.production` not committed to Git
- [ ] GitHub secrets configured
- [ ] HTTPS enabled (production)
- [ ] Regular backups scheduled

## Cost Estimate

**DigitalOcean Monthly Costs:**
- Droplet (2GB RAM): $12/month
- Backups (optional): $2.40/month
- **Total**: ~$15/month

## Support

- Issues: [GitHub Issues](https://github.com/your-username/mafia-night/issues)
- Docs: [Documentation](docs/notes/)

---

**Next Steps:**
1. Set up VPS: `just setup-vps`
2. Configure environment: `cp .env.production.example .env.production`
3. Deploy: `just deploy-prod`
4. Configure GitHub Secrets for CI/CD
5. Enable HTTPS with Let's Encrypt

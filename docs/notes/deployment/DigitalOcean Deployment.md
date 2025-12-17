# DigitalOcean Deployment Guide

Complete guide for deploying Mafia Night to a DigitalOcean VPS.

## Overview

```
┌─────────────────────────────────────┐
│       DigitalOcean Droplet          │
│  ┌───────────────────────────────┐  │
│  │          Nginx                │  │
│  │    (Reverse Proxy)            │  │
│  └──────────┬────────────────────┘  │
│             │                        │
│    ┌────────▼────────┐              │
│    │   Frontend      │              │
│    │  (Next.js:3000) │              │
│    └─────────────────┘              │
│             │                        │
│    ┌────────▼────────┐              │
│    │   Backend       │              │
│    │   (Go:8080)     │              │
│    └────────┬────────┘              │
│             │                        │
│    ┌────────▼────────┐              │
│    │   PostgreSQL    │              │
│    │   (Port 5432)   │              │
│    └─────────────────┘              │
│                                      │
│  All in Docker containers            │
└─────────────────────────────────────┘
```

## Prerequisites

### Local Machine
- Git
- SSH client
- Access to GitHub repository

### DigitalOcean Account
- Create account at https://digitalocean.com
- Add payment method
- Generate API token (optional, for CLI)

## Step 1: Create a Droplet

### Via DigitalOcean Dashboard

1. **Login to DigitalOcean**
   - Go to https://cloud.digitalocean.com

2. **Create Droplet**
   - Click "Create" → "Droplets"
   - Choose an image: **Ubuntu 24.04 LTS x64**
   - Choose a plan:
     - **Basic**: $6/month (1GB RAM, 1 vCPU, 25GB SSD)
     - **Recommended**: $12/month (2GB RAM, 1 vCPU, 50GB SSD)
   - Choose a datacenter region (closest to your users)
   - Authentication: **SSH keys** (recommended) or Password
   - Hostname: `mafia-night-prod`

3. **Add SSH Key** (if using SSH authentication)
   - Generate key locally: `ssh-keygen -t ed25519 -C "your-email@example.com"`
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Add to DigitalOcean

4. **Create Droplet**
   - Click "Create Droplet"
   - Wait for droplet to be ready (2-3 minutes)
   - Note the **IP address**

## Step 2: Initial VPS Setup

### Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### Run Setup Script

1. **Upload setup script**:
```bash
# On local machine
scp scripts/deployment/setup-vps.sh root@YOUR_VPS_IP:/tmp/
```

2. **Run setup on VPS**:
```bash
# On VPS
chmod +x /tmp/setup-vps.sh
/tmp/setup-vps.sh
```

This script will:
- Update system packages
- Install Docker and Docker Compose
- Configure firewall (UFW)
- Create deployment user
- Set up deployment directory

3. **Add SSH key for deploy user**:
```bash
# On local machine, copy your public key
cat ~/.ssh/id_ed25519.pub

# On VPS as root
echo "YOUR_PUBLIC_KEY" | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

4. **Test deploy user access**:
```bash
# On local machine
ssh deploy@YOUR_VPS_IP
```

## Step 3: Configure Environment Variables

### Create Production Environment File

```bash
# On local machine
cp .env.production.example .env.production
```

Edit `.env.production`:

```bash
# Database Configuration
DB_USER=mafia_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_NAME=mafia_night

# Backend Configuration
PORT=8080
GIN_MODE=release

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://YOUR_VPS_IP/api

# Deployment Configuration
DEPLOY_USER=deploy
DEPLOY_HOST=YOUR_VPS_IP
DEPLOY_PATH=/opt/mafia-night
```

**Important**: Use a strong password for `DB_PASSWORD`

## Step 4: Manual Deployment

### Deploy Application

```bash
# On local machine
./scripts/deployment/deploy.sh
```

This script will:
1. Copy files to VPS
2. Build Docker images
3. Start all containers
4. Perform health check

### Verify Deployment

1. **Check containers**:
```bash
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml ps'
```

2. **Check logs**:
```bash
# All services
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs --tail=50'

# Specific service
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs frontend --tail=50'
```

3. **Test application**:
```bash
# Health check
curl http://YOUR_VPS_IP/health

# Frontend
curl http://YOUR_VPS_IP

# Backend API
curl http://YOUR_VPS_IP/api/health
```

## Step 5: Set Up CI/CD Pipeline

### Configure GitHub Secrets

Go to your repository: **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DB_USER` | Database username | `mafia_user` |
| `DB_PASSWORD` | Database password | Strong password |
| `DB_NAME` | Database name | `mafia_night` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://YOUR_DOMAIN/api` |
| `DEPLOY_USER` | SSH username | `deploy` |
| `DEPLOY_HOST` | VPS IP or domain | `123.456.789.0` |
| `DEPLOY_PATH` | Deployment path | `/opt/mafia-night` |
| `SSH_PRIVATE_KEY` | Deploy user private key | Contents of `~/.ssh/id_ed25519` |

### Generate SSH Private Key for GitHub

```bash
# On local machine
cat ~/.ssh/id_ed25519
```

Copy entire contents including `-----BEGIN` and `-----END` lines.

### Optional: Docker Hub (for faster deployments)

If you want to use Docker Hub:

1. Create account at https://hub.docker.com
2. Create repository: `your-username/mafia-night`
3. Add GitHub secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub access token

### Test CI/CD Pipeline

```bash
# Make a change
git add .
git commit -m "test: trigger deployment"
git push origin main
```

Watch deployment:
- Go to **Actions** tab in GitHub
- Click on your commit
- Watch the workflow execute

## Step 6: Domain Configuration (Optional)

### Point Subdomain to VPS

1. **In your domain registrar** (e.g., Namecheap, GoDaddy):
   - Add A record: `mafia` → `YOUR_VPS_IP`

   Example for Namecheap:
   - Host: `mafia`
   - Value: `YOUR_VPS_IP`
   - Record Type: A

2. **Wait for DNS propagation** (5 minutes - 48 hours)

3. **Test**:
```bash
ping mafia.your-domain.com
```

### Set Up SSL with Let's Encrypt

See the detailed guide: [[SSL Setup]]

Quick setup:
```bash
# On local machine
just setup-ssl mafia.your-domain.com

# Then update nginx config
cp nginx/nginx-https.conf nginx/nginx.conf
# Edit nginx/nginx.conf to replace 'mafia.your-domain.com' with your actual subdomain

# Update .env.production
NEXT_PUBLIC_API_URL=https://mafia.your-domain.com/api

# Deploy
just deploy-prod
```

## Common Operations

### View Logs

```bash
# All services
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs -f'

# Specific service
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs -f backend'
```

### Restart Services

```bash
# All services
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart'

# Specific service
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml restart backend'
```

### Update Application

```bash
# Automatic via CI/CD
git push origin main

# Manual
./scripts/deployment/deploy.sh
```

### Rollback

```bash
./scripts/deployment/rollback.sh
```

### Database Backup

```bash
# On VPS
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U mafia_user mafia_night > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Database Restore

```bash
# On VPS
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
cat your_backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U mafia_user mafia_night
```

## Monitoring

### Check Resource Usage

```bash
# On VPS
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Check Application Health

```bash
# Automated health check
curl http://YOUR_VPS_IP/health

# Backend health
curl http://YOUR_VPS_IP/api/health

# Frontend
curl -I http://YOUR_VPS_IP
```

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs backend
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U mafia_user -d mafia_night
```

### Out of Memory

```bash
# Check memory usage
free -h

# Upgrade droplet in DigitalOcean dashboard
# Or add swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Port Already in Use

```bash
# Find what's using the port
sudo netstat -tulpn | grep :80

# Kill process or change port in docker-compose.prod.yml
```

## Security Best Practices

1. **Firewall**: Only open necessary ports (22, 80, 443)
2. **SSH**: Use SSH keys, disable password authentication
3. **Database**: Use strong passwords, not exposed to internet
4. **Updates**: Regularly update system and Docker images
5. **Backups**: Regular database backups
6. **SSL**: Use HTTPS in production
7. **Secrets**: Never commit `.env.production` to Git

## Cost Estimation

### DigitalOcean Costs

- **Basic Droplet**: $6/month
- **Recommended Droplet**: $12/month
- **Backups** (optional): 20% of droplet cost
- **Snapshots**: $0.05/GB/month

### Example Monthly Cost

- Droplet (2GB): $12
- Backups: $2.40
- **Total**: ~$15/month

## Related Notes

- [[CI/CD Pipeline]] - Continuous deployment details
- [[Docker Compose]] - Container orchestration
- [[Production Best Practices]] - Security and optimization

---

#deployment #digitalocean #devops #production

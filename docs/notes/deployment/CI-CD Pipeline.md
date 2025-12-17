# CI/CD Pipeline

Continuous Integration and Continuous Deployment setup for Mafia Night.

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Git Push  │────▶│   GitHub    │────▶│   Build &   │────▶│   Deploy    │
│   to main   │     │   Actions   │     │    Test     │     │   to VPS    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Workflow Stages

### 1. Test Backend
- Set up Go environment
- Install dependencies
- Run PostgreSQL service
- Execute Go tests
- Build backend binary

### 2. Test Frontend
- Set up Node.js environment
- Install dependencies
- Run Jest tests
- Build Next.js application

### 3. Build Docker Images
- Build backend Docker image
- Build frontend Docker image
- Cache layers for faster builds
- Optional: Push to Docker Hub

### 4. Deploy to VPS
- Create production environment file
- Set up SSH connection
- Run deployment script
- Perform health check
- Notify status

## Workflow File

Location: `.github/workflows/deploy.yml`

### Trigger Events

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # Manual trigger
```

- **Automatic**: Triggers on every push to `main` branch
- **Manual**: Can be triggered from GitHub Actions UI

## GitHub Secrets Configuration

### Required Secrets

Navigate to: **Repository Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Description | Where to get it |
|------------|-------------|-----------------|
| `DB_USER` | PostgreSQL username | Choose your own |
| `DB_PASSWORD` | PostgreSQL password | Generate strong password |
| `DB_NAME` | Database name | Usually `mafia_night` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://YOUR_DOMAIN/api` |
| `DEPLOY_USER` | SSH username on VPS | Usually `deploy` |
| `DEPLOY_HOST` | VPS IP or domain | From DigitalOcean |
| `DEPLOY_PATH` | Deployment directory | `/opt/mafia-night` |
| `SSH_PRIVATE_KEY` | SSH private key | See below |

### Optional Secrets (Docker Hub)

| Secret Name | Description |
|------------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token |

### Generating SSH Private Key

```bash
# On local machine
cat ~/.ssh/id_ed25519
```

Copy the entire output including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All key content
- `-----END OPENSSH PRIVATE KEY-----`

**Important**: This is your PRIVATE key. Keep it secure!

## Deployment Flow

### 1. Code Push

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Automatic Testing

GitHub Actions runs:
```
✓ Backend tests (with PostgreSQL)
✓ Frontend tests (Jest)
✓ Backend build
✓ Frontend build
```

If any test fails, deployment stops.

### 3. Docker Image Build

```
✓ Build backend image
✓ Build frontend image
✓ Cache layers
```

### 4. Deployment to VPS

```
1. Copy files to VPS
2. Stop old containers
3. Build new images on VPS
4. Start new containers
5. Health check
6. Cleanup old images
```

### 5. Verification

Automatic health check:
```bash
curl http://YOUR_VPS_IP/health
```

## Manual Deployment

### Via GitHub Actions UI

1. Go to **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select branch (main)
5. Click **Run workflow** button

### Via Local Script

```bash
./scripts/deployment/deploy.sh
```

## Monitoring Deployments

### View Workflow Run

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Expand each job to see details
4. Check logs for errors

### Common Statuses

- 🟢 **Success**: Deployment completed
- 🔴 **Failure**: Tests or deployment failed
- 🟡 **In Progress**: Currently running
- ⚪ **Cancelled**: Manually stopped

## Rollback Strategy

### Automatic Rollback

Currently not implemented. On failure, previous version keeps running.

### Manual Rollback

```bash
./scripts/deployment/rollback.sh
```

This requires a backup to exist from previous deployment.

## Environment Management

### Development

- Local development with `docker-compose.yml`
- Uses development Dockerfiles
- Hot reload enabled
- Debug mode

### Production

- VPS with `docker-compose.prod.yml`
- Uses production Dockerfiles
- Optimized builds
- Release mode

## Security Best Practices

### 1. Secrets Management

- ❌ Never commit secrets to Git
- ✅ Use GitHub Secrets
- ✅ Use `.env.production` (gitignored)
- ✅ Rotate secrets periodically

### 2. SSH Keys

- ✅ Use Ed25519 keys (more secure)
- ✅ Different keys for different purposes
- ✅ Passphrase protected
- ❌ Never commit private keys

### 3. Database Passwords

- ✅ Use strong passwords (20+ characters)
- ✅ Mix of letters, numbers, symbols
- ✅ Different for each environment
- ❌ Don't use default passwords

### 4. API Access

- ✅ Rate limiting (configured in nginx)
- ✅ CORS headers properly set
- ✅ HTTPS in production
- ✅ Input validation

## Optimization

### Build Cache

GitHub Actions caches:
- Go modules
- npm packages
- Docker layers

This speeds up builds significantly:
- **First build**: ~5-10 minutes
- **Cached build**: ~2-3 minutes

### Docker Layer Caching

```dockerfile
# Dependencies layer (cached)
COPY package.json ./
RUN npm ci

# Code layer (changes frequently)
COPY . .
RUN npm run build
```

## Troubleshooting

### Tests Failing

```bash
# Run tests locally
cd backend && go test ./...
cd frontend && npm test
```

### Build Failing

Check build logs in GitHub Actions:
1. Click on failed job
2. Expand failing step
3. Read error message
4. Fix issue locally
5. Push again

### Deployment Failing

```bash
# Check deployment logs
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml logs'

# Check if containers are running
ssh deploy@YOUR_VPS_IP 'cd /opt/mafia-night && docker-compose -f docker-compose.prod.yml ps'
```

### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/id_ed25519 deploy@YOUR_VPS_IP

# Check SSH key in GitHub Secrets
# Make sure it includes BEGIN and END lines
# Check for extra spaces or line breaks
```

## Performance Metrics

### Typical Deployment Time

| Stage | Time |
|-------|------|
| Test Backend | ~2 min |
| Test Frontend | ~1 min |
| Build Images | ~3 min |
| Deploy to VPS | ~2 min |
| **Total** | **~8 min** |

With caching:
- **Total**: ~4-5 min

## Notifications (Future Enhancement)

Consider adding:
- Slack notifications
- Email notifications
- Discord webhooks
- Status badges in README

Example Slack notification:
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Related Notes

- [[DigitalOcean Deployment]] - VPS setup and manual deployment
- [[Docker Compose]] - Container orchestration
- [[Testing Workflow]] - Test configuration

---

#cicd #github-actions #automation #devops

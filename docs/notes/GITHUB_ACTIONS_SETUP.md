# GitHub Actions CI/CD Setup Guide

## Quick Setup Checklist

- [ ] Configure GitHub Secrets
- [ ] Test workflow with manual trigger
- [ ] Verify deployment to VPS
- [ ] Check CORS configuration

## Step-by-Step Setup

### 1. Navigate to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**

### 2. Add Required Secrets

Add each of these secrets one by one:

#### Database Secrets

**`DB_USER`**
```
mafia_user
```

**`DB_PASSWORD`**
```
[Your strong password - generate with: openssl rand -base64 32]
```

**`DB_NAME`**
```
mafia_night
```

#### CORS Configuration

**`ALLOWED_ORIGINS`** ⚠️ **IMPORTANT FOR CORS**
```
http://your-domain.com,https://your-domain.com
```

**Examples:**
- With domain: `http://mafia.example.com,https://mafia.example.com`
- With IP: `http://123.456.789.012,https://123.456.789.012`
- With www: `http://example.com,https://example.com,http://www.example.com,https://www.example.com`

**Format:**
- Comma-separated (no spaces)
- Include both HTTP and HTTPS
- Include protocol (`http://` or `https://`)
- No trailing slashes

#### API Configuration

**`NEXT_PUBLIC_API_URL`**
```
http://your-domain.com/api
```

Or with IP:
```
http://123.456.789.012/api
```

#### Deployment Configuration

**`DEPLOY_USER`**
```
deploy
```

**`DEPLOY_HOST`**
```
your-vps-ip-or-domain
```

**`DEPLOY_PATH`**
```
/opt/mafia-night
```

**`SSH_PRIVATE_KEY`**
```
-----BEGIN OPENSSH PRIVATE KEY-----
[Your private SSH key content]
-----END OPENSSH PRIVATE KEY-----
```

To get your SSH private key:
```bash
cat ~/.ssh/id_ed25519
```

**Important:**
- Copy the ENTIRE key including BEGIN and END lines
- Preserve all line breaks
- No extra spaces at start/end

### 3. Verify Secrets

After adding all secrets, you should have **9 secrets** total:

1. ✅ `DB_USER`
2. ✅ `DB_PASSWORD`
3. ✅ `DB_NAME`
4. ✅ `ALLOWED_ORIGINS` ← **New for CORS**
5. ✅ `NEXT_PUBLIC_API_URL`
6. ✅ `DEPLOY_USER`
7. ✅ `DEPLOY_HOST`
8. ✅ `DEPLOY_PATH`
9. ✅ `SSH_PRIVATE_KEY`

### 4. Test the Workflow

#### Manual Trigger

1. Go to **Actions** tab
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Select **main** branch
5. Click **Run workflow**

#### Watch Progress

The workflow will:
1. ✓ Test backend (with PostgreSQL)
2. ✓ Test frontend (Jest tests)
3. ✓ Build Docker images
4. ✓ Deploy to VPS

Expected time: ~8 minutes (first run), ~5 minutes (cached)

### 5. Verify Deployment

#### Check Workflow Status

In GitHub Actions, you should see:
```
Deploy to Production
✓ Test Backend
✓ Test Frontend
✓ Build and Push Docker Images
✓ Deploy to VPS
```

#### Check Backend Logs

SSH into your VPS and check backend logs for CORS confirmation:

```bash
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker-compose -f docker-compose.prod.yml logs backend | grep CORS
```

You should see:
```
CORS enabled for origins: [http://your-domain.com https://your-domain.com]
```

#### Test CORS

From your local machine:

```bash
curl -X OPTIONS http://your-domain.com/api/games \
  -H "Origin: http://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -v | grep -i "access-control"
```

Expected output:
```
Access-Control-Allow-Origin: http://your-domain.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-Moderator-ID
Access-Control-Allow-Credentials: true
```

## Automatic Deployment

Once secrets are configured, the workflow **automatically deploys** on every push to `main`:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

GitHub Actions will:
1. Run all tests
2. Build images
3. Deploy to VPS

## Troubleshooting

### CORS Errors in Production

**Problem:** Frontend gets CORS errors when calling backend

**Solution:**
1. Check `ALLOWED_ORIGINS` secret matches your frontend URL exactly
2. Include both HTTP and HTTPS
3. No trailing slashes
4. Redeploy workflow

### Secret Not Applied

**Problem:** Changes to secrets don't take effect

**Solution:**
1. Edit the secret in GitHub
2. **Re-run the workflow** (changes don't auto-apply)
3. Or push a new commit to trigger deployment

### SSH Key Errors

**Problem:** "Load key: invalid format" or "Permission denied"

**Solution:**
1. Ensure private key includes BEGIN and END lines
2. No extra spaces or line breaks
3. Use correct key (private, not public)
4. Verify key format: `ssh-keygen -l -f ~/.ssh/id_ed25519`

### Wrong CORS Origins

**Problem:** Backend logs show wrong origins

**Solution:**
1. Check `ALLOWED_ORIGINS` format (comma-separated, no spaces)
2. Ensure protocol is included (`http://` or `https://`)
3. Re-run workflow to apply changes
4. Check backend logs to verify: `docker-compose logs backend | grep CORS`

## Example Values

### For Production with Domain

```bash
ALLOWED_ORIGINS=http://mafia-night.example.com,https://mafia-night.example.com
NEXT_PUBLIC_API_URL=http://mafia-night.example.com/api
DEPLOY_HOST=mafia-night.example.com
```

### For Production with IP

```bash
ALLOWED_ORIGINS=http://123.456.789.012,https://123.456.789.012
NEXT_PUBLIC_API_URL=http://123.456.789.012/api
DEPLOY_HOST=123.456.789.012
```

### For Subdomain

```bash
ALLOWED_ORIGINS=http://play.example.com,https://play.example.com
NEXT_PUBLIC_API_URL=http://play.example.com/api
DEPLOY_HOST=play.example.com
```

## Security Best Practices

1. **Never commit secrets** to Git
2. **Use strong passwords** (20+ characters)
3. **Rotate secrets** periodically (every 90 days)
4. **Review access** regularly
5. **Enable 2FA** on GitHub
6. **Use environment protection** rules
7. **Limit CORS origins** to only your domains

## Workflow Features

### Automatic Testing

Every deployment runs:
- Go backend tests (with PostgreSQL)
- Jest frontend tests
- TypeScript compilation
- Docker build validation

### Build Caching

GitHub Actions caches:
- Go modules
- npm packages
- Docker layers

This reduces build time from ~8 min to ~5 min.

### Health Checks

After deployment, the workflow verifies:
- Backend API responds
- Frontend serves pages
- Database connection works

## Monitoring

### View Deployment Status

GitHub Actions tab shows:
- Recent workflow runs
- Success/failure status
- Deployment logs
- Timing information

### Email Notifications

GitHub sends emails on:
- Workflow failures
- First-time workflow runs
- Status changes

Configure in: **Settings** → **Notifications**

## Related Documentation

- [[DEPLOYMENT]] - Manual deployment guide
- [[CORS_SETUP]] - CORS configuration guide
- [[API_INTEGRATION]] - Frontend-backend integration
- [[SSL_SETUP]] - SSL/HTTPS setup
- [[TESTING]] - Backend testing in CI/CD

---

#ci-cd #github-actions #deployment #automation #testing

**Quick Reference:**

```bash
# View secrets (Settings → Secrets → Actions)
# 9 total secrets required
# ALLOWED_ORIGINS format: http://domain.com,https://domain.com
# Test: Actions → Run workflow → main
# Verify: ssh deploy@VPS "cd /opt/mafia-night && docker-compose logs backend | grep CORS"
```

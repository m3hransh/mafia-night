# Quick SSL/HTTPS Setup Guide

Add HTTPS to your Mafia Night deployment in 10 minutes.

## TL;DR - Quick Steps

```bash
# 1. Point your subdomain to VPS IP (in domain registrar DNS settings)
# 2. Wait for DNS propagation (5-30 min)
# 3. Run SSL setup
just setup-ssl mafia.your-domain.com

# 4. Update nginx config
cp nginx/nginx-https.conf nginx/nginx.conf
# Edit nginx/nginx.conf and replace 'mafia.your-domain.com' with your actual subdomain

# 5. Update environment
# In .env.production, change:
NEXT_PUBLIC_API_URL=https://mafia.your-domain.com/api

# 6. Deploy
just deploy-prod

# 7. Test
curl https://your-domain.com
```

Done! 🎉

## Prerequisites

✅ VPS deployed and running
✅ Domain name purchased (Namecheap, GoDaddy, Cloudflare, etc.)
✅ Domain DNS configured to point to VPS IP

## Step-by-Step Guide

### Step 1: Purchase Domain

**Recommended registrars:**
- **Namecheap**: ~$10/year - https://www.namecheap.com
- **Cloudflare**: ~$10/year + free DDoS protection - https://www.cloudflare.com
- **GoDaddy**: ~$15/year - https://www.godaddy.com

### Step 2: Configure DNS

Add an A record for your subdomain in your domain's DNS settings:

```
Type: A    Host: mafia    Value: YOUR_VPS_IP
```

**Example (Namecheap):**
1. Domain List → Manage
2. Advanced DNS tab
3. Add Record → A Record
4. Host: `mafia`, Value: `YOUR_VPS_IP`, TTL: Automatic

**Example (Cloudflare):**
1. DNS → Records
2. Add Record → A
3. Name: `mafia`, IPv4: `YOUR_VPS_IP`, Proxied: ✓

### Step 3: Verify DNS

```bash
# Check if subdomain points to your VPS
ping mafia.your-domain.com

# Or use online tool
# https://dnschecker.org
```

⚠️ **Wait for DNS to propagate!** (5 min - 48 hours, usually ~30 min)

### Step 4: Run SSL Setup Script

```bash
just setup-ssl mafia.your-domain.com
```

This will:
- Install Certbot
- Get free SSL certificate from Let's Encrypt
- Set up auto-renewal
- Copy certificates to deployment directory

You'll be prompted for:
- Email (for renewal notices)
- Agree to Terms of Service

### Step 5: Update Nginx Configuration

```bash
# Copy HTTPS config template
cp nginx/nginx-https.conf nginx/nginx.conf

# Edit and replace 'mafia.your-domain.com' with your actual subdomain
vim nginx/nginx.conf
```

Or manually edit `nginx/nginx.conf` and replace the subdomain.

### Step 6: Update Environment

Edit `.env.production`:

```bash
# Change from HTTP to HTTPS
NEXT_PUBLIC_API_URL=https://mafia.your-domain.com/api
```

### Step 7: Deploy

```bash
just deploy-prod
```

### Step 8: Test HTTPS

```bash
# Test HTTPS
curl https://mafia.your-domain.com

# Test HTTP redirect
curl -I http://mafia.your-domain.com
# Should show: HTTP/1.1 301 Moved Permanently

# Test SSL certificate
curl -vI https://mafia.your-domain.com
```

**Online SSL Test:**
- https://www.ssllabs.com/ssltest/
- Enter your domain
- Should get A or A+ rating

## What You Get

✅ **Free SSL Certificate** (Let's Encrypt)
✅ **Auto-renewal** (certificates auto-renew every 90 days)
✅ **A+ SSL Rating** (secure configuration)
✅ **HTTP → HTTPS redirect** (all traffic encrypted)
✅ **Modern TLS 1.2/1.3** (old protocols disabled)
✅ **Security headers** (HSTS, XSS protection, etc.)

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS
nslookup mafia.your-domain.com

# If not working, wait longer or check DNS settings in registrar
```

### Certificate Generation Failed

```bash
# Make sure port 80 is free
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker compose -f docker-compose.prod.yml stop nginx

# Try again
just setup-ssl mafia.your-domain.com
```

### Site Not Loading with HTTPS

```bash
# Check if nginx is running
ssh deploy@YOUR_VPS_IP
cd /opt/mafia-night
docker compose -f docker-compose.prod.yml ps

# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# Verify certificates exist
ls -la /opt/mafia-night/nginx/ssl/
```

## Certificate Renewal

Certificates auto-renew! The setup script configures a cron job that:
- Runs twice daily
- Renews certificates when they're 30 days from expiration
- Automatically restarts nginx with new certificates

Check renewal status:

```bash
ssh deploy@YOUR_VPS_IP
sudo certbot certificates
```

## Cost

**SSL Certificate**: FREE (Let's Encrypt)
**Domain**: $10-15/year
**Total**: Just the domain cost!

Compare to paid SSL: $50-200/year 💰

## Architecture

```
┌─────────────────────────────────────┐
│  Browser                            │
│    ↓ HTTPS (443) ← Free SSL Cert   │
│  Nginx (Reverse Proxy)              │
│    ↓ HTTP (internal - encrypted)   │
│  Frontend → Backend → Database      │
└─────────────────────────────────────┘
```

## Security Features

- 🔒 TLS 1.2 and 1.3 only (TLS 1.0/1.1 disabled)
- 🔒 Strong cipher suites
- 🔒 HTTP Strict Transport Security (HSTS)
- 🔒 Automatic HTTP to HTTPS redirect
- 🔒 OCSP Stapling
- 🔒 Security headers (XSS, clickjacking protection)
- 🔒 Auto-renewal (never expires)

## Complete Documentation

For detailed information, see:
- [docs/notes/deployment/SSL Setup.md](docs/notes/deployment/SSL%20Setup.md)

## Support

**Issues?**
- Check [Troubleshooting section](#troubleshooting) above
- View detailed guide: `docs/notes/deployment/SSL Setup.md`
- Let's Encrypt docs: https://letsencrypt.org/docs/

---

**Time to complete**: ~10 minutes
**Cost**: $0 (SSL is free!)
**Difficulty**: Easy ⭐

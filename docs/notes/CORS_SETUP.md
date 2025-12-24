# CORS Configuration Guide

## Overview

The Mafia Night backend uses environment-based CORS configuration to support both development and production environments securely.

## How It Works

### Development Mode
When `ALLOWED_ORIGINS` environment variable is **not set**, the backend automatically allows:
- `http://localhost:3000`
- `https://localhost:3000`
- `http://localhost:3001`
- `https://localhost:3001`

### Production Mode
When `ALLOWED_ORIGINS` environment variable **is set**, the backend uses only those specified origins.

## Configuration

### For Development

No configuration needed! Just start the backend:

```bash
cd backend
go run cmd/api/main.go
```

Output:
```
CORS enabled for origins: [http://localhost:3000 https://localhost:3000 http://localhost:3001 https://localhost:3001]
```

### For Production

#### 1. Using Domain Name

Edit `.env.production`:
```bash
ALLOWED_ORIGINS=http://mafia-night.example.com,https://mafia-night.example.com
```

#### 2. Using IP Address

Edit `.env.production`:
```bash
ALLOWED_ORIGINS=http://123.456.789.012,https://123.456.789.012
```

#### 3. Mixed (Domain + Subdomain)

```bash
ALLOWED_ORIGINS=http://mafia.example.com,https://mafia.example.com,http://www.mafia.example.com,https://www.mafia.example.com
```

## Deployment

### Docker Compose

The `docker-compose.prod.yml` automatically passes `ALLOWED_ORIGINS` to the backend container:

```yaml
backend:
  environment:
    ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
```

Just deploy:
```bash
just deploy-prod
```

### Manual Deployment

```bash
export ALLOWED_ORIGINS="http://your-domain.com,https://your-domain.com"
cd backend
go run cmd/api/main.go
```

## Verification

### Check Logs

On startup, the backend logs enabled origins:
```
Starting Mafia Night API server on port 8080
CORS enabled for origins: [http://your-domain.com https://your-domain.com]
```

### Test CORS Preflight

```bash
curl -X OPTIONS http://your-api-url/api/games \
  -H "Origin: http://your-frontend-url" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-Moderator-ID" \
  -v
```

Expected response headers:
```
Access-Control-Allow-Origin: http://your-frontend-url
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-Moderator-ID
Access-Control-Allow-Credentials: true
```

### Test Actual Request

```bash
curl -X POST http://your-api-url/api/games \
  -H "Origin: http://your-frontend-url" \
  -H "Content-Type: application/json" \
  -H "X-Moderator-ID: test-moderator-123" \
  -v
```

Expected:
```
Access-Control-Allow-Origin: http://your-frontend-url
```

## Common Issues

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Frontend origin not in `ALLOWED_ORIGINS`

**Solution**:
1. Check `.env.production` has correct frontend URL
2. Ensure HTTP/HTTPS matches frontend URL exactly
3. Restart backend after changing environment variables

### Issue: "CORS enabled for origins: []"

**Cause**: `ALLOWED_ORIGINS` is set but empty

**Solution**:
1. Check `.env.production` syntax: `ALLOWED_ORIGINS=http://domain.com,https://domain.com`
2. No spaces around commas
3. Include protocol (http:// or https://)

### Issue: Works locally but fails in production

**Cause**: Production uses different URL than configured

**Solution**:
1. Check actual frontend URL in browser
2. Include both HTTP and HTTPS if using SSL
3. Add www subdomain if applicable

## Security Notes

1. **Never use wildcard** (`*`) for `AllowCredentials: true` - CORS spec forbids it
2. **Include protocol** - `http://domain.com` and `https://domain.com` are different origins
3. **Port matters** - `http://domain.com` and `http://domain.com:3000` are different
4. **Development defaults** are safe - only localhost allowed when env var not set
5. **Explicit production config** - must manually specify allowed origins

## Environment Variable Format

```bash
# Single origin
ALLOWED_ORIGINS=http://example.com

# Multiple origins (comma-separated, no spaces)
ALLOWED_ORIGINS=http://example.com,https://example.com

# With subdomain
ALLOWED_ORIGINS=http://app.example.com,https://app.example.com

# IP address
ALLOWED_ORIGINS=http://123.456.789.012,https://123.456.789.012

# Mixed
ALLOWED_ORIGINS=http://example.com,https://example.com,http://app.example.com,https://app.example.com
```

## Code Reference

Backend implementation: `backend/cmd/api/main.go`

```go
func getAllowedOrigins() []string {
    originsEnv := os.Getenv("ALLOWED_ORIGINS")

    if originsEnv != "" {
        // Production: use environment variable
        origins := strings.Split(originsEnv, ",")
        for i, origin := range origins {
            origins[i] = strings.TrimSpace(origin)
        }
        return origins
    }

    // Development: default to localhost
    return []string{
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3001",
    }
}
```

## Related Documentation

- [[API_INTEGRATION]] - Full API setup and integration guide
- [[DEPLOYMENT]] - Production deployment guide
- [[GITHUB_ACTIONS_SETUP]] - CI/CD and environment variables
- [[TESTING]] - Backend testing with CORS

---

#cors #security #configuration #deployment #api

**Quick Reference:**
- Development: No config needed, uses localhost
- Production: Set `ALLOWED_ORIGINS` in `.env.production`
- Format: Comma-separated, include protocol
- Verify: Check logs on startup

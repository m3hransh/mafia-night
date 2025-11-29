# Docker Compose

Multi-container orchestration for development and deployment.

## What is Docker Compose?

Docker Compose runs multiple containers as a coordinated application.

## Our Setup

Three services defined in `docker-compose.yml`:

### 1. PostgreSQL
```yaml
postgres:
  image: postgres:16-alpine
  ports:
    - "5432:5432"
  environment:
    POSTGRES_DB: mafia_night
    POSTGRES_USER: mafia_user
    POSTGRES_PASSWORD: mafia_pass
```

### 2. Backend (Go API)
```yaml
backend:
  build: ./backend
  ports:
    - "8080:8080"
  depends_on:
    postgres:
      condition: service_healthy
```

### 3. Frontend (Next.js)
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:3000"
  depends_on:
    - backend
```

## Commands

Using [[Just]]:
```bash
just up              # Start all services
just up-detached     # Start in background
just down            # Stop all services
just logs            # View logs
just db              # Start only database
just db-connect      # Connect to PostgreSQL
```

Raw Docker Compose:
```bash
docker-compose up --build
docker-compose down
docker-compose logs -f
docker-compose ps
```

## Service URLs

When running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

## Health Checks

Backend waits for database to be ready:
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

Database health check:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U mafia_user"]
  interval: 5s
  timeout: 5s
  retries: 5
```

## Volume Mounts

Development mode mounts source code:
```yaml
volumes:
  - ./backend:/app
  - ./frontend:/app
```

Changes reflected immediately (hot reload).

## Environment Variables

### Backend
```env
DATABASE_URL=postgres://mafia_user:mafia_pass@postgres:5432/mafia_night?sslmode=disable
PORT=8080
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Use Cases

### Full Stack Development
```bash
just up
# All services running
# Make changes → see results
```

### Database Only
```bash
just db
# Just PostgreSQL
# Run backend/frontend locally with Nix
```

### Production-like Testing
```bash
just up-detached
# Services in background
# Test as if deployed
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port
lsof -i :3000
lsof -i :8080
lsof -i :5432

# Stop conflicting service
docker-compose down
```

### Stale Containers
```bash
# Rebuild from scratch
docker-compose down
docker-compose up --build
```

### Database Issues
```bash
# Connect to database
just db-connect

# Reset database
docker-compose down -v  # Removes volumes!
docker-compose up
```

## Related Notes

- [[PostgreSQL]] - Database service
- [[Docker Workflow]] - Using Docker
- [[Development Workflow]] - Daily development
- [[Quick Start]] - Getting started

## Configuration

See `docker-compose.yml` in project root.

---

#docker #containers #devops #development

# Justfile - Command runner for Mafia Night
# Run `just` or `just --list` to see available commands

# Default recipe (runs when you type `just`)
default:
  @just --list

# Backend commands
# ===============

# Run all backend tests
test-backend:
  #!/usr/bin/env bash
  cd backend
  if command -v gotestsum &> /dev/null; then
    gotestsum --format testname -- -p 1 ./...
  else
    go test -p 1 ./...
  fi

# Run backend tests with verbose output
test-backend-verbose:
  #!/usr/bin/env bash
  cd backend
  if command -v gotestsum &> /dev/null; then
    gotestsum --format standard-verbose -- -p 1 ./...
  else
    go test -v -p 1 ./...
  fi

# Run backend tests with coverage
test-backend-coverage:
  #!/usr/bin/env bash
  cd backend
  if command -v gotestsum &> /dev/null; then
    gotestsum --format testname -- -p 1 -cover ./...
  else
    go test -p 1 -cover ./...
  fi

# Run backend tests in watch mode
test-backend-watch:
  cd backend && ../scripts/test-watch.sh

# Run backend server
run-backend:
  cd backend && go run ./cmd/api

# Build backend binary
build-backend:
  cd backend && go build -o bin/api ./cmd/api

# Format backend code
fmt-backend:
  cd backend && go fmt ./...
  cd backend && gofumpt -l -w .

# Lint backend code
lint-backend:
  cd backend && golangci-lint run

# Frontend commands
# ================

# Install frontend dependencies
install-frontend:
  cd frontend && npm install

# Run all frontend tests
test-frontend:
  cd frontend && npm test

# Run frontend tests in watch mode
test-frontend-watch:
  cd frontend && npm run test:watch

test-e2e:
  cd frontend && npm run test:e2e
# Run frontend dev server
dev-frontend:
  cd frontend && npm run dev:https

# Build frontend for production
build-frontend:
  cd frontend && npm run build

# Lint frontend code
lint-frontend:
  cd frontend && npm run lint

# Combined commands
# ================

# Run all tests (backend + frontend)
test: test-backend test-frontend

# Format all code
fmt: fmt-backend
  cd frontend && npm run format 2>/dev/null || echo "No format script"

# Lint all code
lint: lint-backend lint-frontend

# Deployment commands
# ===================

# Set up VPS for deployment (run once)
setup-vps:
  @echo "Uploading setup script to VPS..."
  @read -p "Enter VPS IP: " vps_ip && \
  scp scripts/deployment/setup-vps.sh root@$$vps_ip:/tmp/ && \
  echo "Run on VPS: ssh root@$$vps_ip 'chmod +x /tmp/setup-vps.sh && /tmp/setup-vps.sh'"

# Set up SSL/HTTPS with Let's Encrypt
setup-ssl DOMAIN:
  @if [ ! -f .env.production ]; then \
    echo "Error: .env.production not found"; \
    exit 1; \
  fi
  ./scripts/deployment/setup-ssl.sh {{DOMAIN}}

# Deploy to production
deploy-prod:
  @if [ ! -f .env.production ]; then \
    echo "Error: .env.production not found. Copy from .env.production.example"; \
    exit 1; \
  fi
  ./scripts/deployment/deploy.sh

# Rollback to previous deployment
rollback:
  ./scripts/deployment/rollback.sh

# Build production Docker images locally (testing)
build-prod:
  docker compose -f docker-compose.prod.yml build

# Start production stack locally (testing)
up-prod:
  docker compose -f docker-compose.prod.yml up -d

# Stop production stack
down-prod:
  docker compose -f docker-compose.prod.yml down

# View production logs
logs-prod:
  docker compose -f docker-compose.prod.yml logs -f

# SSH into production VPS
ssh-prod:
	@set -a && . {{justfile_directory()}}/.env.production && set +a && ssh ${DEPLOY_USER}@${DEPLOY_HOST}

# View production container status on VPS
status-prod:
	@set -a && . {{justfile_directory()}}/.env.production && set +a && \
	ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml ps"

# View production logs on VPS
logs-prod-vps SERVICE="":
	@set -a && . {{justfile_directory()}}/.env.production && set +a && \
	ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml logs -f {{SERVICE}}"

# Docker commands
# ==============

# Start all services with Docker
up:
  docker compose up --build

# Start services in background
up-detached:
  docker compose up -d --build

# Stop all services
down:
  docker compose down

# View logs
logs:
  docker compose logs -f

# Database commands
# ================

# Start PostgreSQL only
db:
  docker compose up -d postgres

# Connect to PostgreSQL
db-connect:
  docker compose exec postgres psql -U mafia_user -d mafia_night

# Stop database
db-stop:
  docker compose stop postgres

# Clean commands
# =============

# Clean build artifacts
clean:
  rm -rf backend/bin
  rm -rf frontend/.next
  rm -rf frontend/out

# Clean dependencies
clean-deps:
  rm -rf frontend/node_modules

# Clean everything (including Docker volumes)
clean-all: clean clean-deps
  docker-compose down -v
  rm -rf result result-*

# Development setup
# ================

# Initial setup (run once)
setup: install-frontend
  @echo "✅ Setup complete!"
  @echo "Run 'just dev' to start development"

# Start development environment
dev:
  @echo "Starting development environment..."
  @echo "Backend: http://localhost:8080"
  @echo "Frontend: http://localhost:3000"
  @just up-detached

# Nix commands
# ===========

# Build with Nix
nix-build:
  nix build

# Run with Nix
nix-run:
  nix run

# Enter development shell
nix-shell:
  nix develop

# Update flake inputs
nix-update:
  nix flake update

# Check flake
nix-check:
  nix flake check

# Ent commands
# ===========

# Generate Ent code from schema
ent-generate:
  cd backend && go generate ./ent

# Create database schema (auto-migration)
db-migrate:
  cd backend && go run ./cmd/migrate

# Seed database with default roles
db-seed:
  cd backend && go run ./cmd/seed

# Reset database (drop + create + seed)
db-reset: db-drop db-migrate db-seed

# Drop all tables
db-drop:
  docker compose exec postgres psql -U mafia_user -d mafia_night -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

db-drop-test:
  docker compose exec postgres psql -U mafia_user -d mafia_night_test -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Production database commands
db-migrate-prod:
	@set -a && . {{justfile_directory()}}/.env.production && set +a && \
	ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend ./migrate"

db-seed-prod:
	@set -a && . {{justfile_directory()}}/.env.production && set +a && \
	ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd ${DEPLOY_PATH} && docker compose -f docker-compose.prod.yml exec -T backend ./seed"

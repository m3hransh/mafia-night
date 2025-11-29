# Justfile - Command runner for Mafia Night
# Run `just` or `just --list` to see available commands

# Default recipe (runs when you type `just`)
default:
  @just --list

# Backend commands
# ===============

# Run all backend tests
test-backend:
  cd backend && go test ./...

# Run backend tests with verbose output
test-backend-verbose:
  cd backend && go test -v ./...

# Run backend tests with coverage
test-backend-coverage:
  cd backend && go test -cover ./...

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

# Run frontend dev server
dev-frontend:
  cd frontend && npm run dev

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

# Docker commands
# ==============

# Start all services with Docker
up:
  docker-compose up --build

# Start services in background
up-detached:
  docker-compose up -d --build

# Stop all services
down:
  docker-compose down

# View logs
logs:
  docker-compose logs -f

# Database commands
# ================

# Start PostgreSQL only
db:
  docker-compose up -d postgres

# Connect to PostgreSQL
db-connect:
  docker-compose exec postgres psql -U mafia_user -d mafia_night

# Stop database
db-stop:
  docker-compose stop postgres

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

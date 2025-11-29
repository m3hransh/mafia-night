# Mafia Night 🎭

A web application for managing physical Mafia games with real-time role distribution via Telegram bot.

> **🎉 Now using Nix Flakes!** Pure, reproducible development environment with automatic loading via direnv. No more Bazel complexity!

## Quick Start

```bash
# 1. Install Nix (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# 2. Clone and enter directory
git clone <repository-url>
cd mafia-night

# 3. Enable automatic environment (recommended)
direnv allow

# 4. Run tests
just test

# 5. Start development
just dev
```

**That's it!** Environment loads automatically with direnv. 🚀

---

## Features

- 🎮 Create and manage Mafia games
- 👥 Player registration and game joining
- 🎲 Random role distribution
- 📱 Private role delivery via Telegram
- 🎯 Moderator dashboard with full game visibility
- ⚡ Real-time player updates

## Tech Stack

### Backend
- **Language:** Go 1.25.4
- **Build System:** Nix Flakes
- **Database:** PostgreSQL 16
- **ORM:** Ent (Type-safe ORM)
- **Testing:** Go testing package + testify

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library

### DevOps
- **Build:** Nix Flakes (pure, reproducible builds)
- **Task Runner:** Just (modern command runner)
- **Auto-load:** direnv (automatic environment)
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (coming soon)

## Project Structure

```
mafia-night/
├── WORKSPACE                 # Bazel workspace configuration
├── BUILD.bazel              # Root build file
├── .bazelversion            # Bazel version lock
├── docker-compose.yml       # Docker orchestration
├── PROJECT_PHASES.md        # Development roadmap
│
├── backend/                 # Go backend
│   ├── BUILD.bazel
│   ├── go.mod
│   ├── ent/                # Generated Ent ORM code
│   │   ├── schema/         # Database schema definitions
│   │   └── ...
│   ├── cmd/api/            # Main application
│   │   ├── main.go
│   │   ├── main_test.go
│   │   └── BUILD.bazel
│   ├── internal/           # Private packages
│   │   ├── models/
│   │   ├── repository/
│   │   ├── service/
│   │   └── handler/
│   └── pkg/                # Public packages
│
└── frontend/               # Next.js frontend
```

## Getting Started

### Prerequisites

- **Nix** with flakes enabled (install from [nixos.org](https://nixos.org))
- **direnv** (optional but recommended for auto-loading)
- **Docker** and Docker Compose (for full stack development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mafia-night
   ```

2. **Enable direnv** (recommended for automatic environment)
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   eval "$(direnv hook bash)"  # or zsh
   
   # Allow direnv in this project
   direnv allow
   
   # Environment loads automatically! ✨
   ```

3. **Or use nix develop** (manual)
   ```bash
   nix develop
   ```

### Running with Just (Recommended)

```bash
# See all available commands
just

# Run all tests
just test

# Start all services (Docker)
just up

# Backend API: http://localhost:8080
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
```

### Running with Nix (Alternative)

#### Backend
```bash
# Run backend tests
just test-backend
# or: nix develop --command bash -c "cd backend && go test ./..."

# Build backend with Nix
nix build

# Run backend
nix run
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Start development server
npm run dev

# Build for production
npm run build
```

### Running Tests

#### Backend (Go)
```bash
# Run all backend tests
just test-backend

# Or using Go directly
cd backend
go test ./...
go test -v ./cmd/api

# With coverage
just test-backend-coverage
```

#### Frontend (Next.js)
```bash
cd frontend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode (auto-rerun on file changes)
npm run test:watch
```

## Development Workflow (TDD)

This project follows **Test-Driven Development (TDD)**:

1. **Write Test First** 🔴
   ```bash
   # Create test file
   touch backend/internal/service/game_service_test.go
   # Write failing test
   ```

2. **Run Test (Should Fail)** ❌
   ```bash
   just test-backend
   # or: cd backend && go test ./internal/service
   ```

3. **Write Implementation** ✍️
   ```bash
   # Write minimal code to pass test
   vim backend/internal/service/game_service.go
   ```

4. **Run Test (Should Pass)** ✅
   ```bash
   just test-backend
   ```

5. **Refactor** ♻️
   ```bash
   # Improve code while keeping tests green
   ```

## Database Migrations

```bash
# Uses Ent ORM Auto-Migration
just db-migrate
```

## API Documentation

API documentation will be available at `/api/docs` (Swagger UI) once implemented in Phase 3.

## Project Phases

See [PROJECT_PHASES.md](./PROJECT_PHASES.md) for detailed development roadmap.

**Current Phase:** 🚧 Phase 2 - Core Domain Models & Database Layer (In Progress)

## Environment Variables

### Backend
```env
DATABASE_URL=postgres://mafia_user:mafia_pass@localhost:5432/mafia_night?sslmode=disable
PORT=8080
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Contributing

1. Follow TDD principles (write tests first!)
2. Run tests before committing
3. Follow Go and TypeScript style guides
4. Update documentation as needed

## License

MIT

## Authors

- Your Name - Initial work

---

**Happy Gaming! 🎲🎭**

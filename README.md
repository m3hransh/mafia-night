# Mafia Night 🎭

A web application for managing physical Mafia games with real-time role distribution via Telegram bot.

## Features

- 🎮 Create and manage Mafia games
- 👥 Player registration and game joining
- 🎲 Random role distribution
- 📱 Private role delivery via Telegram
- 🎯 Moderator dashboard with full game visibility
- ⚡ Real-time player updates

## Tech Stack

### Backend
- **Language:** Go 1.23
- **Build System:** Bazel
- **Database:** PostgreSQL 16
- **Testing:** Go testing package + testify

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library

### DevOps
- **Build:** Bazel (for both backend and frontend)
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
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── tailwind.config.js
    ├── app/                # Next.js app router
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/         # React components
    └── __tests__/          # Test files
```

## Getting Started

### Prerequisites

- **Bazel** 8.4.2 (automatically managed by Bazelisk)
- **Docker** and Docker Compose
- **Go** 1.23+ (for local development)
- **Node.js** 22+ (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mafia-night
   ```

2. **Install Bazelisk** (if not already installed)
   ```bash
   npm install -g @bazel/bazelisk
   # or download binary from: https://github.com/bazelbuild/bazelisk/releases
   ```

### Running with Docker (Recommended)

```bash
# Start all services (database, backend, frontend)
docker-compose up --build

# Backend API: http://localhost:8080
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
```

### Running with Bazel (Alternative)

#### Backend
```bash
# Run backend tests
bazel test //backend/cmd/api:api_test

# Build backend binary
bazel build //backend/cmd/api:api

# Run backend server
bazel run //backend/cmd/api:api
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
# Run all backend tests with Bazel
bazel test //...

# Run specific package tests
bazel test //backend/cmd/api:api_test

# Or using Go directly
cd backend
go test ./...
go test -v ./cmd/api
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
   bazel test //backend/internal/service:service_test
   ```

3. **Write Implementation** ✍️
   ```bash
   # Write minimal code to pass test
   vim backend/internal/service/game_service.go
   ```

4. **Run Test (Should Pass)** ✅
   ```bash
   bazel test //backend/internal/service:service_test
   ```

5. **Refactor** ♻️
   ```bash
   # Improve code while keeping tests green
   ```

## Database Migrations

```bash
# Coming in Phase 2
# Will use golang-migrate
```

## API Documentation

API documentation will be available at `/api/docs` (Swagger UI) once implemented in Phase 3.

## Project Phases

See [PROJECT_PHASES.md](./PROJECT_PHASES.md) for detailed development roadmap.

**Current Phase:** ✅ Phase 1 - Project Setup & Infrastructure

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

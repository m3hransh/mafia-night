# Tech Stack

Technologies used in Mafia Night.

## Backend

### Language
- **[[Go Language]]** - Go 1.25.4
  - Fast, compiled, type-safe
  - Excellent concurrency
  - Simple deployment

### Database
- **[[PostgreSQL]]** - PostgreSQL 16
  - Relational database
  - ACID compliance
  - JSON support

### Testing
- `testing` package (Go standard library)
- `testify` - Assertions and mocks

## Frontend

### Framework
- **[[Next.js]]** - Next.js 16 (App Router)
  - React 19 based
  - Server-side rendering
  - File-based routing
  - Runs on port 3001

### Language
- **TypeScript 5.9** - Type safety for JavaScript
  - Strict mode enabled
  - Path aliases (@/*)
  - Better IDE support
  - Fewer runtime errors

### 3D Graphics
- **Three.js 0.182** - WebGL 3D library
  - `@react-three/fiber` - React renderer for Three.js
  - `@react-three/drei` - Helper components (cameras, controls, etc.)
  - `three-stdlib` - Extended Three.js utilities
  - `troika-three-text` - 3D text rendering
  - Custom shader materials
  - Video textures
  - Gyroscope support (mobile)
  - Mouse tracking (desktop)

### Styling
- **Tailwind CSS 4** - Utility-first CSS
  - Rapid development
  - Consistent design
  - Small bundle size
  - PostCSS integration

### Testing
- **Jest 30** - Test runner with jsdom environment
- **React Testing Library 16** - Component testing
- Coverage reporting
- Watch mode support

## DevOps

### Build System
- **[[Nix Flakes]]** - Pure, reproducible builds
  - Declarative configuration
  - Automatic dependencies
  - Cross-platform

### Task Runner
- **[[Just]]** - Modern command runner
  - Simple syntax
  - Cross-platform
  - Fast

### Environment
- **[[direnv]]** - Automatic environment loading
  - Seamless activation
  - Per-directory config

### Containers
- **[[Docker Compose]]** - Multi-container orchestration
  - Development environment
  - Service dependencies

## Future Integrations

### Telegram
- **go-telegram-bot-api** - Telegram bot SDK
- Webhook-based communication

### Migrations
- **golang-migrate** - Database migrations
- Version control for schema

## Package Management

### Frontend
- **npm** - Package manager
  - `package-lock.json` for deterministic installs
  - Development and production dependencies

### Backend
- **Go modules** - Native Go dependency management
  - `go.mod` and `go.sum` files
  - Semantic versioning

## Related Notes

- [[Project Overview]] - What we're building
- [[Development Workflow]] - How to use these tools
- [[Quick Start]] - Getting started
- [[Bazel Migration]] - Why we chose Nix over Bazel
- [[Frontend Architecture]] - Frontend design
- [[Next.js]] - Frontend framework details

---

#stack #tools #technologies #threejs

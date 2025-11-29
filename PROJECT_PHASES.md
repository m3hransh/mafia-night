# Mafia Night - Project Development Phases (TDD Approach)

## Project Overview
A web application for managing physical Mafia games with:
- Golang backend API
- Next.js frontend
- Telegram bot for role distribution
- Moderator dashboard for game management
- Player interface for joining games

---

## Phase 1: Project Setup & Infrastructure
**Goal:** Set up the foundational structure for both backend and frontend

### Tasks:
- [x] Initialize Go backend project structure with modules
- [x] Set up Next.js frontend project with TypeScript
- [x] Configure testing frameworks (Go: testing package + testify, Next.js: Jest + React Testing Library)
- [x] Set up Docker configuration for local development
- [ ] Create initial database schema design (PostgreSQL)
- [ ] Set up CI/CD pipeline configuration
- [ ] Create README with setup instructions

### Deliverables:
- Working Go project with test runner
- Working Next.js project with test runner
- Docker Compose setup for local development
- Database migration system setup

---

## Phase 2: Core Domain Models & Database Layer
**Goal:** Implement core data models and database operations with tests

### Backend Tests & Implementation:
- [x] Test: Game model (ID, status, created_at, moderator_id)
- [x] Test: Player model (ID, name, telegram_id, game_id)
- [x] Test: Role model (ID, name, team, abilities)
- [x] Test: GameRole model (game_id, player_id, role_id, assigned_at)
- [x] Implement: Database migrations (Ent ORM Auto-migration)
- [ ] Implement: Repository pattern for CRUD operations (Game Repo ✅, others pending)
- [x] Test: Database connection and basic queries

### Deliverables:
- Complete database schema
- Repository layer with 100% test coverage
- Migration scripts

---

## Phase 3: Game Creation & Management API
**Goal:** Build API endpoints for moderators to create and manage games

### Backend Tests & Implementation:
- [ ] Test: POST /api/games - Create new game
- [ ] Test: GET /api/games/:id - Get game details
- [ ] Test: PATCH /api/games/:id - Update game status
- [ ] Test: DELETE /api/games/:id - Delete game
- [ ] Test: Game ID generation (unique, shareable)
- [ ] Test: Moderator authentication/authorization
- [ ] Implement: Game service layer
- [ ] Implement: API handlers with validation

### Deliverables:
- REST API for game management
- Tested service layer
- API documentation (Swagger/OpenAPI)

---

## Phase 4: Player Join & Registration API
**Goal:** Enable players to join games using game ID

### Backend Tests & Implementation:
- [ ] Test: POST /api/games/:id/join - Player joins game
- [ ] Test: GET /api/games/:id/players - List players in game
- [ ] Test: DELETE /api/games/:id/players/:player_id - Remove player
- [ ] Test: Duplicate name validation within a game
- [ ] Test: Join validation (game exists, game not started)
- [ ] Implement: Player service layer
- [ ] Implement: Join API handlers

### Frontend Tests & Implementation:
- [ ] Test: Join game form component
- [ ] Test: Form validation (name, game ID)
- [ ] Test: API integration
- [ ] Implement: Player join page
- [ ] Implement: Success/error notifications

### Deliverables:
- Player join API endpoints
- Player join UI page
- Integration tests

---

## Phase 5: Role Management System
**Goal:** Create system for defining and managing Mafia roles

### Backend Tests & Implementation:
- [ ] Test: GET /api/roles - List available roles
- [ ] Test: Role configuration (Mafia, Doctor, Detective, Villager, etc.)
- [ ] Test: POST /api/games/:id/roles - Configure roles for game
- [ ] Test: Validation: roles count matches players count
- [ ] Implement: Predefined role templates
- [ ] Implement: Custom role configuration

### Frontend Tests & Implementation:
- [ ] Test: Role selection component
- [ ] Test: Role count vs player count validation
- [ ] Test: Predefined role templates UI
- [ ] Implement: Moderator role configuration page
- [ ] Implement: Role quantity selector

### Deliverables:
- Role management API
- Role configuration UI
- Predefined role templates

---

## Phase 6: Role Distribution Algorithm
**Goal:** Implement random role assignment system

### Backend Tests & Implementation:
- [ ] Test: Random role distribution algorithm
- [ ] Test: POST /api/games/:id/distribute - Assign roles to players
- [ ] Test: Role assignment uniqueness
- [ ] Test: Distribution idempotency (can't redistribute)
- [ ] Test: Game state transition (pending -> active)
- [ ] Implement: Secure random role assignment
- [ ] Implement: Transaction handling for atomic distribution

### Deliverables:
- Role distribution service with tests
- Game state management
- Distribution API endpoint

---

## Phase 7: Telegram Bot Integration
**Goal:** Build Telegram bot for private role delivery

### Backend Tests & Implementation:
- [ ] Test: Telegram bot webhook handler
- [ ] Test: /start command - Link player to game
- [ ] Test: Role notification message formatting
- [ ] Test: POST /api/games/:id/notify - Send roles via Telegram
- [ ] Test: Player-Telegram account linking
- [ ] Implement: Telegram bot setup (BotFather)
- [ ] Implement: Webhook handlers
- [ ] Implement: Message templates for roles
- [ ] Implement: Error handling for failed notifications

### Deliverables:
- Working Telegram bot
- Role notification system
- Player-Telegram linking mechanism

---

## Phase 8: Moderator Dashboard
**Goal:** Create comprehensive moderator interface

### Frontend Tests & Implementation:
- [ ] Test: Game creation form
- [ ] Test: Game details view (all players + roles)
- [ ] Test: Player management (add/remove)
- [ ] Test: Role distribution trigger
- [ ] Test: Game status display
- [ ] Test: Real-time player list updates
- [ ] Implement: Moderator dashboard layout
- [ ] Implement: Game management UI
- [ ] Implement: Player list component
- [ ] Implement: Role reveal toggle (show/hide roles)

### Backend Tests & Implementation:
- [ ] Test: GET /api/moderator/games/:id/full - Get complete game data
- [ ] Test: WebSocket connection for real-time updates
- [ ] Implement: Real-time player join notifications

### Deliverables:
- Complete moderator dashboard
- Real-time updates functionality
- Game control interface

---

## Phase 9: Player Interface & Game Status
**Goal:** Build player-facing interface

### Frontend Tests & Implementation:
- [ ] Test: Game lobby view
- [ ] Test: Player list display (without roles)
- [ ] Test: Game status indicators
- [ ] Test: "Waiting for roles" state
- [ ] Test: Telegram connection prompt
- [ ] Implement: Game lobby page
- [ ] Implement: Connection status indicator
- [ ] Implement: Instructions for Telegram bot

### Backend Tests & Implementation:
- [ ] Test: GET /api/games/:id/status - Public game status
- [ ] Test: Player-specific view (no role visibility)
- [ ] Implement: Public game info endpoint

### Deliverables:
- Player lobby interface
- Game status page
- Telegram integration instructions

---

## Phase 10: Polish, Security & Deployment
**Goal:** Production readiness and deployment

### Security:
- [ ] Test: API rate limiting
- [ ] Test: Input sanitization
- [ ] Test: SQL injection prevention
- [ ] Test: XSS prevention
- [ ] Implement: JWT/session authentication
- [ ] Implement: HTTPS enforcement
- [ ] Implement: CORS configuration

### Polish:
- [ ] Test: Error handling across all endpoints
- [ ] Test: Edge cases (empty games, timeout scenarios)
- [ ] Implement: Comprehensive error messages
- [ ] Implement: Loading states and animations
- [ ] Implement: Mobile responsive design
- [ ] Implement: Game cleanup/archive system

### Deployment:
- [ ] Production Docker configuration
- [ ] Database backup strategy
- [ ] Monitoring and logging setup
- [ ] Production deployment (e.g., AWS, DigitalOcean, Railway)
- [ ] Telegram bot production webhook

### Documentation:
- [ ] API documentation complete
- [ ] User guide for moderators
- [ ] User guide for players
- [ ] Deployment documentation

### Deliverables:
- Production-ready application
- Complete documentation
- Deployed and accessible application
- Monitoring dashboards

---

## Technology Stack Summary

### Backend:
- **Language:** Go 1.21+
- **Framework:** Chi/Gin for routing
- **Database:** PostgreSQL
- **ORM:** sqlx or GORM
- **Testing:** testing package + testify
- **Telegram:** go-telegram-bot-api

### Frontend:
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library
- **State Management:** React Context / Zustand
- **HTTP Client:** Fetch API / Axios

### DevOps:
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Database Migrations:** golang-migrate

---

## Getting Started

When you're ready to proceed with each phase, say "continue with Phase X" and I'll:
1. Create the test files first (TDD approach)
2. Run the tests to see them fail
3. Implement the functionality
4. Run the tests to see them pass
5. Refactor if needed

Ready to start with Phase 1 when you are!

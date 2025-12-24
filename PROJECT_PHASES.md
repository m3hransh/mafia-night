# Mafia Night - Project Development Phases (TDD Approach)

## Project Overview
A web application for managing physical Mafia games with:
- Golang backend API
- Next.js frontend
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
- [x] Create initial database schema design (PostgreSQL)
- [x] Set up CI/CD pipeline configuration
- [x] Create README with setup instructions

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
- [x] Test: Player model (ID, name, game_id)
- [x] Test: Role model (ID, name, team, abilities)
- [x] Test: GameRole model (game_id, player_id, role_id, assigned_at)
- [x] Implement: Database migrations (Ent ORM Auto-migration)
- [x] Test: Database connection and basic queries

### Deliverables:
- Complete database schema
- Repository layer with 100% test coverage
- Migration scripts

---

## Phase 3: Game Creation & Management API
**Goal:** Build API endpoints for moderators to create and manage games

### Backend Tests & Implementation:
- [x] Test: POST /api/games - Create new game
- [x] Test: GET /api/games/:id - Get game details
- [x] Test: PATCH /api/games/:id - Update game status
- [x] Test: DELETE /api/games/:id - Delete game
- [x] Test: Game ID generation (unique, shareable)
- [x] Test: Moderator authentication/authorization
- [x] Implement: Game service layer
- [x] Implement: API handlers with validation

### Deliverables:
- ✅ REST API for game management
- ✅ Tested service layer
- ⚠️ API documentation (Swagger/OpenAPI) - Can be added later

---

## Phase 4: Player Join & Registration API
**Goal:** Enable players to join games using game ID

### Backend Tests & Implementation:
- [x] Test: POST /api/games/:id/join - Player joins game
- [x] Test: GET /api/games/:id/players - List players in game
- [x] Test: DELETE /api/games/:id/players/:player_id - Remove player
- [x] Test: Duplicate name validation within a game
- [x] Test: Join validation (game exists, game not started)
- [x] Implement: Player service layer
- [x] Implement: Join API handlers

### Frontend Tests & Implementation:
- [x] Test: Join game form component
- [x] Test: Form validation (name, game ID)
- [x] Test: API integration
- [x] Implement: Player join page
- [x] Implement: Success/error notifications

### Deliverables:
- Player join API endpoints
- Player join UI page
- Integration tests

---

## Phase 5: Role Management System
**Goal:** Create system for defining and managing Mafia roles

### Backend Tests & Implementation:
- [x] Test: GET /api/roles - List available roles
- [x] Test: Role configuration (Mafia, Doctor, Detective, Villager, etc.)
- [x] Test: POST /api/games/:id/roles - Configure roles for game
- [x] Test: Validation: roles count matches players count
- [ ] Implement: Predefined role templates
- [ ] Implement: Custom role configuration

### Frontend Tests & Implementation:
- [x] Test: Role selection component
- [x] Test: Role count vs player count validation
- [x] Test: Predefined role templates UI
- [x] Implement: Moderator role configuration page
- [x] Implement: Role quantity selector

### Deliverables:
- Role management API
- Role configuration UI
- Predefined role templates

---

## Phase 6: Role Distribution Algorithm
**Goal:** Implement random role assignment system

### Backend Tests & Implementation:
- [x] Test: Random role distribution algorithm
- [x] Test: POST /api/games/:id/distribute - Assign roles to players
- [x] Test: Role assignment uniqueness
- [x] Test: Distribution idempotency (can't redistribute)
- [x] Test: Game state transition (pending -> active)
- [x] Implement: Secure random role assignment
- [x] Implement: Transaction handling for atomic distribution

### Deliverables:
- Role distribution service with tests
- Game state management
- Distribution API endpoint

---

## Phase 7: Moderator Dashboard
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

## Phase 8: Player Interface & Game Status
**Goal:** Build player-facing interface

### Frontend Tests & Implementation:
- [ ] Test: Game lobby view
- [ ] Test: Player list display (without roles)
- [ ] Test: Game status indicators
- [ ] Test: "Waiting for roles" state
- [ ] Implement: Game lobby page
- [ ] Implement: Connection status indicator

### Backend Tests & Implementation:
- [ ] Test: GET /api/games/:id/status - Public game status
- [ ] Test: Player-specific view (no role visibility)
- [ ] Implement: Public game info endpoint

### Deliverables:
- Player lobby interface
- Game status page

---

## Phase 9: Polish, Security & Deployment
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

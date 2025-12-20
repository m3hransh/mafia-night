# Current Features - December 2024

## Completed Features ✅

### 🎮 Game Management
- **Create Game** - Moderators can create games with unique 6-character codes
- **Join Game** - Players join using game codes
- **Real-time Player List** - Auto-updating list of joined players (2-second polling)
- **Game Phases** - Waiting for players → Role selection → Game started

### 🎨 UI/UX Enhancements
- **Animated Gradient Background** - Dark, animated background for all pages
- **Role Cards with Videos** - Each role card displays its `.webm` video preview
  - Videos autoplay and loop
  - Portrait-style cards (3:4 aspect ratio)
  - Text overlay with blur effect at bottom
  - Shows role name and team (mafia/village/independent)
- **Responsive Design** - Mobile-first approach
- **Buy Me a Coffee Button** - Support link (icon-only on mobile, full button on desktop)

### 🔗 Social Features
- **Share Game Link** - Native share API integration
  - Opens WhatsApp/messaging apps on mobile
  - Falls back to clipboard copy on desktop
  - Includes game code in share text
- **Copy Game Code** - Quick copy button with "Copied!" feedback

### 💾 State Persistence
- **localStorage Integration** - Games persist across browser sessions
- **Auto-restore Moderator** - Moderators return to their game after refresh
- **Auto-restore Players** - Players rejoin their game automatically
- **Backend Validation** - Verifies game/player still exists before restore
- **24-hour Expiry** - Old game data automatically cleared

### 🎭 Role Management
- **30 Unique Roles** - Seeded into database with slug-based URLs
- **Role Selection Panel** - Moderator can select roles for players
- **Role Details Page** - View role description, abilities, team
- **Role Gallery** - Browse all roles with video previews

### 🧪 Testing Infrastructure
- **Backend Tests** - Go tests with `-p 1` for sequential execution
- **Frontend Unit Tests** - Jest + React Testing Library
- **E2E Tests** - Playwright tests for game flow
  - Create game flow
  - Join game flow
  - Role selection flow
  - Error handling
  - Social sharing
- **CI/CD Pipeline** - GitHub Actions with automated testing

### 🚀 Deployment
- **DigitalOcean VPS** - Production deployment
- **Docker Compose** - Container orchestration
- **SSL/HTTPS** - Secure connections with Let's Encrypt
- **Database Migrations** - Automated schema updates
- **Database Seeding** - `just db-seed-prod` command

## Technical Stack

### Backend
- **Go 1.25** - Backend API
- **Chi Router** - HTTP routing
- **Ent ORM** - Database schema and queries
- **PostgreSQL 16** - Database

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **localStorage API** - State persistence

### DevOps
- **Nix Flakes** - Development environment
- **Docker Compose** - Local and production deployment
- **GitHub Actions** - CI/CD
- **Just** - Task runner
- **Playwright** - E2E testing with Nix integration

## File Structure

```
frontend/
├── app/
│   ├── page.tsx              # Home page
│   ├── create-game/
│   │   └── page.tsx          # Game creation + role selection
│   ├── join-game/
│   │   └── page.tsx          # Player join flow
│   ├── roles/
│   │   └── page.tsx          # Role gallery
│   └── role/[slug]/
│       └── page.tsx          # Individual role details
├── components/
│   ├── GradientBackground.tsx
│   ├── RoleSelectionPanel.tsx
│   ├── BuyCoffee.tsx
│   └── ...
├── lib/
│   ├── api.ts                # Backend API calls
│   └── gameStorage.ts        # localStorage utilities
└── e2e/
    ├── game-flow.spec.ts     # E2E tests
    └── roles-gallery.spec.ts

backend/
├── cmd/
│   ├── api/                  # HTTP server
│   ├── migrate/              # Database migrations
│   └── seed/                 # Database seeding
├── internal/
│   ├── database/             # Repository layer
│   ├── handler/              # HTTP handlers
│   ├── service/              # Business logic
│   └── seed/                 # Seed data
└── ent/                      # Generated ORM code
    └── schema/               # Database schemas
```

## Recent Updates (December 20, 2024)

### Latest Changes
1. **Game State Persistence** - Added localStorage for moderator/player sessions
2. **Role Card Videos** - Changed from YouTube thumbnails to direct `.webm` video playback
3. **Darker Background** - Updated gradient from slate to pure black
4. **Test Fixes** - Fixed CI test failures with sequential execution
5. **Buy Me a Coffee** - Added support button with responsive design
6. **Share Button** - Added native share API for game links

## Next Steps 🚧

### Planned Features
- [ ] Telegram bot integration for role distribution
- [ ] WebSocket support for real-time updates (replace polling)
- [ ] Game status management (start/end game)
- [ ] Player removal functionality
- [ ] Role assignment and distribution
- [ ] Game history and statistics
- [ ] Multiple game support for moderators
- [ ] Better error handling and user feedback
- [ ] Offline support with service workers

### Technical Debt
- [ ] Replace polling with WebSocket connections
- [ ] Add comprehensive error boundaries
- [ ] Improve loading states
- [ ] Add retry logic for failed API calls
- [ ] Optimize video loading (lazy load, preload hints)

## Links
- [[Project Overview]]
- [[Game State Persistence]]
- [[Tech Stack]]
- [[Phase 1 - Infrastructure]]
- [[Testing Workflow]]

## Tags
#features #status #overview #progress

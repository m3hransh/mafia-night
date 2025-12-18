# Development Workflow

Daily development workflow using [[TDD Approach]].

## Morning Routine

### 1. Update Code
```bash
cd mafia-night
git pull origin main
```

### 2. Environment Loads
With [[direnv]]:
```bash
# Automatic! Just cd into directory
cd mafia-night
```

Without direnv:
```bash
nix develop
```

### 3. Check Tests Pass
```bash
just test
```

Start with green tests! ✅

## TDD Cycle (Backend)

### 1. 🔴 Write Failing Test
```bash
# Create test file
vim backend/internal/service/game_service_test.go
```

```go
func TestCreateGame(t *testing.T) {
    service := NewGameService()
    game, err := service.CreateGame("moderator-123")
    
    assert.NoError(t, err)
    assert.NotEmpty(t, game.ID)
}
```

### 2. ❌ Run Test (Should Fail)
```bash
just test-backend
# FAIL: service doesn't exist yet
```

### 3. ✅ Write Implementation
```bash
vim backend/internal/service/game_service.go
```

```go
type GameService struct {}

func NewGameService() *GameService {
    return &GameService{}
}

func (s *GameService) CreateGame(moderatorID string) (*Game, error) {
    return &Game{
        ID: generateID(),
        ModeratorID: moderatorID,
    }, nil
}
```

### 4. ✅ Run Test (Should Pass)
```bash
just test-backend
# PASS: all tests passing
```

### 5. ♻️ Refactor
Improve code while keeping tests green.

## TDD Cycle (Frontend)

### 1. 🔴 Write Failing Test
```bash
vim frontend/__tests__/components/GameForm.test.tsx
```

```tsx
test('submits game form', () => {
    render(<GameForm />)
    
    fireEvent.click(screen.getByText('Create Game'))
    
    expect(screen.getByText('Game Created')).toBeInTheDocument()
})
```

### 2. ❌ Run Test (Should Fail)
```bash
just test-frontend
```

### 3. ✅ Write Component
```bash
vim frontend/components/GameForm.tsx
```

### 4. ✅ Run Test (Should Pass)
```bash
just test-frontend
```

### 5. ♻️ Refactor

## Watch Mode

### Backend
```bash
# In one terminal
cd backend
go test -watch ./...
```

### Frontend
```bash
# In one terminal
just test-frontend-watch
```

Auto-reruns tests on file changes.

## Running Services

### Full Stack
```bash
just dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

### Backend Only
```bash
just run-backend
```

### Frontend Only
```bash
just dev-frontend
```

### Frontend with HTTPS (for testing device sensors)
Required for testing device orientation/gyroscope on mobile devices.

#### First Time Setup
```bash
# 1. Install local CA (optional but recommended)
mkcert -install

# 2. Generate certificates
cd frontend
mkdir -p certs
cd certs
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

This creates:
- `frontend/certs/localhost-key.pem` - Private key
- `frontend/certs/localhost.pem` - Certificate
- Valid for localhost, 127.0.0.1, and ::1
- Expires in 3 years

#### Run with HTTPS
```bash
cd frontend
npm run dev:https
```

- Frontend: https://localhost:3000

#### Notes
- Use HTTPS when testing device features (gyroscope, camera, etc.)
- Browsers require HTTPS for sensor access on mobile
- `mkcert -install` prevents browser security warnings
- Certificates are gitignored and local to your machine

## Code Quality

### Format Code
```bash
just fmt              # All code
just fmt-backend      # Go only
just fmt-frontend     # TypeScript only
```

### Lint Code
```bash
just lint             # All code
just lint-backend     # Go only
just lint-frontend    # TypeScript only
```

## Git Workflow

### 1. Create Branch
```bash
git checkout -b feature/game-creation
```

### 2. Make Changes (TDD)
Write tests → implement → refactor

### 3. Commit
```bash
git add .
git commit -m "feat: add game creation API"
```

### 4. Push
```bash
git push origin feature/game-creation
```

### 5. Pull Request
Open PR on GitHub.

## Common Tasks

### Add New Endpoint
1. Write test in `*_test.go`
2. Run test (fail)
3. Implement handler
4. Run test (pass)
5. Add route

### Add New Component
1. Write test in `__tests__/`
2. Run test (fail)
3. Create component
4. Run test (pass)
5. Import in page

### Update Dependencies

Backend:
```bash
cd backend
go get -u ./...
go mod tidy
```

Frontend:
```bash
cd frontend
npm update
```

Nix:
```bash
nix flake update
```

## Debugging

### Backend
```bash
# Print debugging
log.Printf("Debug: %v", value)

# Run with verbose
just test-backend-verbose
```

### Frontend
```bash
# Console debugging
console.log('Debug:', value)

# Run with watch
just test-frontend-watch
```

## Evening Routine

### 1. Ensure Tests Pass
```bash
just test
```

### 2. Commit Changes
```bash
git add .
git commit -m "feat: description"
git push
```

### 3. Clean Up (Optional)
```bash
just clean
```

## Related Notes

- [[TDD Approach]] - Testing methodology
- [[Testing Workflow]] - Test commands
- [[Build Workflow]] - Building
- [[Docker Workflow]] - Containers
- [[Just]] - Command reference

---

#workflow #development #tdd #daily

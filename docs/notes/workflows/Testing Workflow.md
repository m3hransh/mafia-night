# Testing Workflow

How to run and write tests following [[TDD Approach]].

## Quick Reference

```bash
just test                    # All tests
just test-backend           # Go tests
just test-frontend          # Jest tests
just test-backend-coverage  # Go with coverage
just test-frontend-watch    # Jest watch mode
```

## Backend Testing (Go)

### Run All Tests
```bash
just test-backend
# or
cd backend && go test ./...
```

### Run Specific Package
```bash
cd backend
go test ./cmd/api
go test ./internal/service
```

### Verbose Output
```bash
just test-backend-verbose
# or
cd backend && go test -v ./...
```

### With Coverage
```bash
just test-backend-coverage
# Creates: backend/coverage.out
```

View coverage:
```bash
cd backend
go tool cover -html=coverage.out
```

### Watch Mode (Manual)
```bash
cd backend
while true; do
    clear
    go test ./...
    sleep 2
done
```

## Frontend Testing (Jest)

### Run All Tests
```bash
just test-frontend
# or
cd frontend && npm test
```

### Watch Mode
```bash
just test-frontend-watch
# or
cd frontend && npm run test:watch
```

Auto-reruns tests on file changes.

### With Coverage
```bash
cd frontend && npm run test:coverage
```

Creates coverage report in `frontend/coverage/`.

### Specific Test File
```bash
cd frontend
npm test -- page.test.tsx
npm test -- GameForm.test.tsx
```

### Update Snapshots
```bash
cd frontend
npm test -- -u
```

## Writing Tests

### Backend Test Structure
```go
package api

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestHealthHandler(t *testing.T) {
    // Arrange
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()
    
    // Act
    healthHandler(w, req)
    
    // Assert
    assert.Equal(t, 200, w.Code)
}
```

File: `*_test.go` (same directory as code)

### Frontend Test Structure
```tsx
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home', () => {
    it('renders title', () => {
        // Arrange & Act
        render(<Home />)
        
        // Assert
        expect(screen.getByText('Mafia Night')).toBeInTheDocument()
    })
})
```

File: `__tests__/component.test.tsx`

## Test Organization

### Backend
```
backend/
  cmd/api/
    main.go
    main_test.go          # Tests for main.go
  internal/service/
    game_service.go
    game_service_test.go  # Tests for game_service.go
```

### Frontend
```
frontend/
  app/
    page.tsx
  components/
    GameForm.tsx
  __tests__/
    page.test.tsx         # Tests for app/page.tsx
    GameForm.test.tsx     # Tests for components/GameForm.tsx
```

## TDD Red-Green-Refactor

See [[TDD Approach]] for details.

### Step 1: Red 🔴
Write failing test:
```bash
vim backend/internal/service/game_service_test.go
just test-backend  # Should FAIL
```

### Step 2: Green 🟢
Write minimal implementation:
```bash
vim backend/internal/service/game_service.go
just test-backend  # Should PASS
```

### Step 3: Refactor ♻️
Improve code:
```bash
vim backend/internal/service/game_service.go
just test-backend  # Should still PASS
```

## Continuous Testing

### Backend (Manual Watch)
```bash
# Terminal 1: Watch tests
cd backend
watch -n 2 go test ./...

# Terminal 2: Write code
vim internal/service/game_service.go
```

### Frontend (Jest Watch)
```bash
# Terminal 1: Jest watch
just test-frontend-watch

# Terminal 2: Write code
vim components/GameForm.tsx
```

## Common Patterns

### HTTP Handler Test (Go)
```go
func TestCreateGameHandler(t *testing.T) {
    body := `{"moderator_id":"123"}`
    req := httptest.NewRequest("POST", "/api/games", strings.NewReader(body))
    w := httptest.NewRecorder()
    
    handler(w, req)
    
    assert.Equal(t, 201, w.Code)
}
```

### Component Test (React)
```tsx
import { render, fireEvent } from '@testing-library/react'

test('form submission', () => {
    render(<GameForm />)
    
    fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Test Game' }
    })
    fireEvent.click(screen.getByText('Submit'))
    
    expect(screen.getByText('Success')).toBeInTheDocument()
})
```

### Mock Test (Go)
```go
type mockRepo struct{}

func (m *mockRepo) CreateGame(game *Game) error {
    return nil
}

func TestServiceWithMock(t *testing.T) {
    service := NewGameService(&mockRepo{})
    // Test service logic without real database
}
```

## Troubleshooting

### Tests Hanging
```bash
# Kill and restart
Ctrl+C
just test-backend
```

### Cache Issues
```bash
# Backend
cd backend && go clean -testcache

# Frontend
cd frontend && npm test -- --clearCache
```

### Import Errors
```bash
# Backend
cd backend && go mod tidy

# Frontend
cd frontend && npm install
```

## Coverage Goals

- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 70%+ coverage
- **Critical paths**: 100% coverage

## Related Notes

- [[TDD Approach]] - Testing methodology
- [[Development Workflow]] - Daily workflow
- [[Running Tests]] - Test commands
- [[Just]] - Task runner

## Further Reading

- Go testing: https://golang.org/pkg/testing/
- testify: https://github.com/stretchr/testify
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/react

---

#testing #workflow #tdd #quality

# Go Language

Backend language for Mafia Night.

## Version

**Go 1.25.4** (via [[Nix Flakes]])

## Why Go?

### ✅ Fast
- Compiled to native binary
- Fast startup time
- Efficient memory usage

### ✅ Simple
- Small language (25 keywords)
- Easy to read
- Consistent style (gofmt)

### ✅ Concurrent
- Goroutines (lightweight threads)
- Channels for communication
- Great for servers

### ✅ Great Tooling
- `go test` - Built-in testing
- `go fmt` - Automatic formatting
- `go mod` - Dependency management
- `gopls` - Language server

### ✅ Production Ready
- Used by Google, Uber, Netflix
- Excellent standard library
- Strong ecosystem

## Key Features

### Goroutines
```go
func main() {
    go handleRequest()  // Runs concurrently
    go handleAnother()  // Another goroutine
    
    time.Sleep(time.Second)  // Wait
}
```

### Channels
```go
func worker(jobs <-chan int, results chan<- int) {
    for job := range jobs {
        results <- job * 2
    }
}
```

### Interfaces
```go
type GameRepository interface {
    Create(game *Game) error
    GetByID(id string) (*Game, error)
}

// Any type with these methods implements the interface
type postgresRepo struct { db *sql.DB }
func (r *postgresRepo) Create(game *Game) error { ... }
func (r *postgresRepo) GetByID(id string) (*Game, error) { ... }
```

### Error Handling
```go
func doSomething() error {
    result, err := mightFail()
    if err != nil {
        return fmt.Errorf("doing something: %w", err)
    }
    
    return nil
}
```

## Project Structure

Following Go conventions:
```
backend/
├── cmd/           # Executables
│   └── api/      # Main application
├── internal/     # Private code
│   ├── handler/  # HTTP handlers
│   ├── service/  # Business logic
│   └── repository/ # Data access
└── pkg/          # Public libraries
```

See [[Backend Architecture]] for details.

## Testing

### Test Files
```go
// game_service_test.go
package service

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestGameService_CreateGame(t *testing.T) {
    service := NewGameService()
    
    game, err := service.CreateGame("mod-123")
    
    assert.NoError(t, err)
    assert.NotEmpty(t, game.ID)
}
```

### Running Tests
```bash
just test-backend
# or
cd backend && go test ./...
```

### Table-Driven Tests
```go
func TestValidateGameID(t *testing.T) {
    tests := []struct {
        name    string
        id      string
        wantErr bool
    }{
        {"valid", "ABC123", false},
        {"too short", "AB", true},
        {"invalid chars", "ABC@123", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateGameID(tt.id)
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Common Patterns

### HTTP Handler
```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}
```

### Struct with Methods
```go
type GameService struct {
    repo GameRepository
}

func NewGameService(repo GameRepository) *GameService {
    return &GameService{repo: repo}
}

func (s *GameService) CreateGame(moderatorID string) (*Game, error) {
    // Implementation
}
```

### Error Wrapping
```go
if err != nil {
    return fmt.Errorf("create game: %w", err)
}
```

## Dependencies

Managed with `go.mod`:
```go
module github.com/mafia-night/backend

go 1.25

require (
    github.com/stretchr/testify v1.8.4
)
```

### Adding Dependencies
```bash
cd backend
go get github.com/gorilla/mux
go mod tidy
```

## Tools

Provided by [[Nix Flakes]]:
- **gopls** - Language server (IDE support)
- **gotools** - goimports, etc.
- **go-tools** - staticcheck (linter)
- **gofumpt** - Stricter formatter

## Code Style

### Formatting
```bash
gofmt -w .     # Format code
goimports -w . # Format + organize imports
```

### Linting
```bash
golangci-lint run
staticcheck ./...
```

### Best Practices
- Prefer small interfaces
- Return errors, don't panic
- Use `gofmt` consistently
- Write tests first ([[TDD Approach]])
- Keep functions small

## Learning Resources

- Official Tour: https://tour.golang.org/
- Effective Go: https://golang.org/doc/effective_go
- Go by Example: https://gobyexample.com/

## Related Notes

- [[Backend Architecture]] - How we use Go
- [[TDD Approach]] - Testing methodology
- [[Tech Stack]] - All technologies
- [[Phase 1 - Infrastructure]] - Go setup
- [[Testing Workflow]] - Running Go tests

---

#go #language #backend #tools

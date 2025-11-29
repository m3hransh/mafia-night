# Backend Architecture

Design and organization of the [[Go Language]] backend.

## Overview

```
┌─────────────┐
│   HTTP      │  cmd/api/main.go
│   Server    │
└──────┬──────┘
       │
┌──────▼──────┐
│  Handlers   │  internal/handler/
│  (HTTP)     │
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │  internal/service/
│  (Logic)    │
└──────┬──────┘
       │
┌──────▼──────┐
│ Repository  │  internal/repository/
│ (Data)      │
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │  PostgreSQL
│             │
└─────────────┘
```

## Layers

### 1. HTTP Server (`cmd/api/`)
Entry point and routing.

```go
func main() {
    // Setup routes
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/api/games", gameHandler)
    
    // Start server
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Responsibilities:**
- Start HTTP server
- Configure routes
- Middleware setup
- Graceful shutdown

### 2. Handlers (`internal/handler/`)
HTTP request/response handling.

```go
type GameHandler struct {
    service *service.GameService
}

func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
    var req CreateGameRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    game, err := h.service.CreateGame(req.ModeratorID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    
    json.NewEncoder(w).Encode(game)
}
```

**Responsibilities:**
- Parse HTTP requests
- Validate input
- Call service layer
- Format HTTP responses
- Error handling

### 3. Services (`internal/service/`)
Business logic.

```go
type GameService struct {
    gameRepo   repository.GameRepository
    playerRepo repository.PlayerRepository
}

func (s *GameService) CreateGame(moderatorID string) (*models.Game, error) {
    game := &models.Game{
        ID:          generateGameID(),
        Status:      "pending",
        ModeratorID: moderatorID,
    }
    
    if err := s.gameRepo.Create(game); err != nil {
        return nil, err
    }
    
    return game, nil
}
```

**Responsibilities:**
- Business rules
- Orchestration
- Transaction management
- Domain logic

### 4. Repository (`internal/repository/`)
Data access.

```go
type GameRepository interface {
    Create(game *models.Game) error
    GetByID(id string) (*models.Game, error)
    Update(game *models.Game) error
    Delete(id string) error
}

type postgresGameRepo struct {
    db *sql.DB
}

func (r *postgresGameRepo) Create(game *models.Game) error {
    _, err := r.db.Exec(
        "INSERT INTO games (id, status, moderator_id) VALUES ($1, $2, $3)",
        game.ID, game.Status, game.ModeratorID,
    )
    return err
}
```

**Responsibilities:**
- SQL queries
- Data mapping
- Connection management
- Query optimization

### 5. Models (`internal/models/`)
Data structures.

```go
type Game struct {
    ID          string    `json:"id" db:"id"`
    Status      string    `json:"status" db:"status"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    ModeratorID string    `json:"moderator_id" db:"moderator_id"`
}
```

**Responsibilities:**
- Define data structures
- JSON/DB tags
- Validation rules

## Project Structure

```
backend/
├── cmd/
│   └── api/
│       ├── main.go              # Entry point
│       └── main_test.go         # Server tests
├── internal/                    # Private packages
│   ├── handler/
│   │   ├── game_handler.go
│   │   └── game_handler_test.go
│   ├── service/
│   │   ├── game_service.go
│   │   └── game_service_test.go
│   ├── repository/
│   │   ├── game_repository.go
│   │   └── game_repository_test.go
│   └── models/
│       └── game.go
├── pkg/                         # Public packages
│   └── utils/
└── db/
    └── migrations/              # Database migrations
```

## Design Patterns

### Dependency Injection
```go
// Wire dependencies in main()
func main() {
    db := setupDatabase()
    
    gameRepo := repository.NewGameRepository(db)
    gameService := service.NewGameService(gameRepo)
    gameHandler := handler.NewGameHandler(gameService)
    
    http.HandleFunc("/api/games", gameHandler.CreateGame)
}
```

### Interface-Based Design
```go
// Define interface
type GameRepository interface {
    Create(game *Game) error
}

// Depend on interface (not concrete type)
type GameService struct {
    repo GameRepository  // Interface, not *postgresGameRepo
}

// Easy to mock for testing
type mockGameRepo struct{}
func (m *mockGameRepo) Create(game *Game) error { return nil }
```

### Repository Pattern
Abstracts data access:
- Business logic doesn't know about SQL
- Easy to swap implementations
- Simple to test (mock repositories)

## Testing Strategy

### Handler Tests
Mock service, test HTTP:
```go
func TestGameHandler_CreateGame(t *testing.T) {
    mockService := &mockGameService{}
    handler := NewGameHandler(mockService)
    
    req := httptest.NewRequest("POST", "/api/games", body)
    w := httptest.NewRecorder()
    
    handler.CreateGame(w, req)
    
    assert.Equal(t, 201, w.Code)
}
```

### Service Tests
Mock repository, test logic:
```go
func TestGameService_CreateGame(t *testing.T) {
    mockRepo := &mockGameRepository{}
    service := NewGameService(mockRepo)
    
    game, err := service.CreateGame("mod-123")
    
    assert.NoError(t, err)
    assert.NotEmpty(t, game.ID)
}
```

### Repository Tests
Real database, test SQL:
```go
func TestGameRepository_Create(t *testing.T) {
    db := setupTestDB(t)
    repo := NewGameRepository(db)
    
    err := repo.Create(&Game{...})
    
    assert.NoError(t, err)
    // Verify in database
}
```

## Error Handling

### Custom Errors
```go
var (
    ErrGameNotFound = errors.New("game not found")
    ErrInvalidInput = errors.New("invalid input")
)
```

### Error Propagation
```go
func (s *GameService) GetGame(id string) (*Game, error) {
    game, err := s.repo.GetByID(id)
    if err != nil {
        return nil, fmt.Errorf("get game: %w", err)
    }
    return game, nil
}
```

## Configuration

### Environment Variables
```go
type Config struct {
    DatabaseURL string
    Port        string
}

func LoadConfig() *Config {
    return &Config{
        DatabaseURL: os.Getenv("DATABASE_URL"),
        Port:        getEnv("PORT", "8080"),
    }
}
```

## Related Notes

- [[Go Language]] - Language features
- [[Project Structure]] - Code organization
- [[Phase 1 - Infrastructure]] - Current state
- [[Phase 2 - Database Layer]] - Next implementation
- [[TDD Approach]] - Testing methodology
- [[PostgreSQL]] - Database

---

#architecture #backend #go #design

# Go HTTP Handlers

## Overview
HTTP handlers are the core of building web applications in Go. Understanding how they work is essential for creating REST APIs.

## The Handler Interface

### Basic Definition
```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

Any type that implements `ServeHTTP` is a `Handler`.

### HandlerFunc Adapter
```go
type HandlerFunc func(ResponseWriter, *Request)

func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) {
    f(w, r)
}
```

This allows functions to be used as handlers.

## Handler Patterns in Our Project

### 1. Method-Based Handlers (Chi Router)
```go
type GameHandler struct {
    gameService *service.GameService
}

func NewGameHandler(gameService *service.GameService) *GameHandler {
    return &GameHandler{gameService: gameService}
}

// Each HTTP operation is a method
func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
    // POST /api/games
}

func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
    // GET /api/games/{id}
}
```

**Benefits:**
- Organized by domain (all game operations together)
- Easy to inject dependencies (gameService)
- Clear method names
- Good for testing

### 2. Routing Setup
```go
r := chi.NewRouter()

// Middleware
r.Use(middleware.RequestID)
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)

// Routes
r.Route("/api", func(r chi.Router) {
    r.Route("/games", func(r chi.Router) {
        r.Post("/", gameHandler.CreateGame)
        r.Get("/{id}", gameHandler.GetGame)
        r.Patch("/{id}", gameHandler.UpdateGameStatus)
        r.Delete("/{id}", gameHandler.DeleteGame)
        r.Post("/{id}/join", gameHandler.JoinGame)
        r.Get("/{id}/players", gameHandler.GetPlayers)
        r.Delete("/{id}/players/{player_id}", gameHandler.RemovePlayer)
    })
})
```

## Request Handling

### 1. Reading URL Parameters
```go
func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
    // Chi URL parameter
    gameID := chi.URLParam(r, "id")
    
    game, err := h.gameService.GetGameByID(r.Context(), gameID)
    // ...
}
```

### 2. Reading Request Headers
```go
func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
    moderatorID := r.Header.Get("X-Moderator-ID")
    
    if moderatorID == "" {
        ErrorResponse(w, http.StatusBadRequest, "X-Moderator-ID header is required")
        return
    }
    // ...
}
```

### 3. Reading Request Body
```go
func (h *GameHandler) JoinGame(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Name string `json:"name"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        ErrorResponse(w, http.StatusBadRequest, "invalid request body")
        return
    }
    
    // Use req.Name
}
```

### 4. Reading Query Parameters
```go
func GetGames(w http.ResponseWriter, r *http.Request) {
    // ?status=active&limit=10
    status := r.URL.Query().Get("status")
    limit := r.URL.Query().Get("limit")
    
    // Convert string to int if needed
    limitInt, _ := strconv.Atoi(limit)
}
```

## Response Handling

### 1. Setting Status Code
```go
w.WriteHeader(http.StatusCreated) // 201
w.WriteHeader(http.StatusNoContent) // 204
w.WriteHeader(http.StatusNotFound) // 404
```

### 2. Setting Headers
```go
w.Header().Set("Content-Type", "application/json")
w.Header().Set("Cache-Control", "no-cache")
```

### 3. Writing Response Body
```go
// JSON response
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(data)

// Plain text
w.WriteHeader(http.StatusOK)
w.Write([]byte("OK"))
```

### 4. Helper Functions
```go
// From our project
func JSONResponse(w http.ResponseWriter, statusCode int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(data)
}

func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
    JSONResponse(w, statusCode, map[string]string{"error": message})
}
```

## Error Handling Pattern

### Consistent Error Response
```go
func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
    gameID := chi.URLParam(r, "id")
    
    game, err := h.gameService.GetGameByID(r.Context(), gameID)
    if err != nil {
        // Check specific errors first
        if errors.Is(err, service.ErrEmptyGameID) {
            ErrorResponse(w, http.StatusBadRequest, err.Error())
            return
        }
        // Generic error last
        ErrorResponse(w, http.StatusNotFound, "game not found")
        return
    }
    
    JSONResponse(w, http.StatusOK, gameToJSON(game))
}
```

### Error Type Mapping
```go
var (
    ErrEmptyGameID        -> 400 Bad Request
    ErrPlayerNameExists   -> 409 Conflict
    ErrGameAlreadyStarted -> 400 Bad Request
    ErrNotAuthorized      -> 403 Forbidden
    NotFound errors       -> 404 Not Found
)
```

## Context Usage

### 1. Request Context
```go
func (h *GameHandler) CreateGame(w http.ResponseWriter, r *http.Request) {
    // Pass context to service layer
    game, err := h.gameService.CreateGame(r.Context(), moderatorID)
    
    // Context carries:
    // - Request cancellation
    // - Deadlines
    // - Request-scoped values
}
```

### 2. Context Values (Use Sparingly)
```go
type contextKey string

const userIDKey contextKey = "userID"

// Set value
ctx := context.WithValue(r.Context(), userIDKey, "user-123")

// Get value
userID := ctx.Value(userIDKey).(string)
```

## Middleware Patterns

### 1. Logging Middleware
```go
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Call next handler
        next.ServeHTTP(w, r)
        
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}
```

### 2. Authentication Middleware
```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        
        if token == "" {
            ErrorResponse(w, http.StatusUnauthorized, "missing token")
            return
        }
        
        // Validate token...
        next.ServeHTTP(w, r)
    })
}
```

### 3. CORS Middleware
```go
func CORSMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

## Testing Handlers

### Using httptest Package
```go
func TestCreateGameHandler(t *testing.T) {
    // Setup
    client := database.SetupTestDB(t)
    gameService := service.NewGameService(client)
    handler := NewGameHandler(gameService)
    
    // Create request
    req := httptest.NewRequest("POST", "/api/games", nil)
    req.Header.Set("X-Moderator-ID", "mod-123")
    
    // Create response recorder
    rr := httptest.NewRecorder()
    
    // Call handler
    handler.CreateGame(rr, req)
    
    // Assert
    assert.Equal(t, http.StatusCreated, rr.Code)
    
    var response map[string]interface{}
    json.NewDecoder(rr.Body).Decode(&response)
    assert.NotEmpty(t, response["id"])
}
```

### Testing with Router
```go
func TestGetGameHandler(t *testing.T) {
    // Create router
    r := chi.NewRouter()
    r.Get("/api/games/{id}", handler.GetGame)
    
    // Create request
    req := httptest.NewRequest("GET", "/api/games/ABC123", nil)
    rr := httptest.NewRecorder()
    
    // Serve
    r.ServeHTTP(rr, req)
    
    assert.Equal(t, http.StatusOK, rr.Code)
}
```

## Best Practices

### 1. Always Set Content-Type
```go
w.Header().Set("Content-Type", "application/json")
```

### 2. Set Status Before Writing Body
```go
// Correct
w.WriteHeader(http.StatusCreated)
json.NewEncoder(w).Encode(data)

// Wrong - status code won't be set
json.NewEncoder(w).Encode(data)
w.WriteHeader(http.StatusCreated) // Too late!
```

### 3. Don't Panic in Handlers
```go
// Use middleware.Recoverer instead
r.Use(middleware.Recoverer)

// Or handle errors gracefully
if err != nil {
    log.Printf("error: %v", err)
    ErrorResponse(w, http.StatusInternalServerError, "internal error")
    return
}
```

### 4. Validate Early
```go
func (h *GameHandler) JoinGame(w http.ResponseWriter, r *http.Request) {
    // Validate URL params
    gameID := chi.URLParam(r, "id")
    if gameID == "" {
        ErrorResponse(w, http.StatusBadRequest, "game ID is required")
        return
    }
    
    // Validate body
    var req struct {
        Name string `json:"name"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        ErrorResponse(w, http.StatusBadRequest, "invalid request body")
        return
    }
    
    // Business logic
    // ...
}
```

### 5. Use Proper HTTP Methods
```go
POST   /api/games              // Create
GET    /api/games/{id}         // Read
PATCH  /api/games/{id}         // Partial Update
PUT    /api/games/{id}         // Full Update
DELETE /api/games/{id}         // Delete
```

### 6. Use Proper Status Codes
```go
200 OK                  // Successful GET, PUT, PATCH
201 Created            // Successful POST
204 No Content         // Successful DELETE
400 Bad Request        // Invalid input
401 Unauthorized       // Missing authentication
403 Forbidden          // Valid auth but no permission
404 Not Found          // Resource doesn't exist
409 Conflict           // Duplicate/conflict
500 Internal Error     // Server error
```

## Common Patterns

### RESTful Resource Handler
```go
type ResourceHandler struct {
    service *Service
}

func (h *ResourceHandler) Create(w http.ResponseWriter, r *http.Request) {
    // POST /resources
}

func (h *ResourceHandler) List(w http.ResponseWriter, r *http.Request) {
    // GET /resources
}

func (h *ResourceHandler) Get(w http.ResponseWriter, r *http.Request) {
    // GET /resources/{id}
}

func (h *ResourceHandler) Update(w http.ResponseWriter, r *http.Request) {
    // PUT/PATCH /resources/{id}
}

func (h *ResourceHandler) Delete(w http.ResponseWriter, r *http.Request) {
    // DELETE /resources/{id}
}
```

## Related Concepts
- [[Go JSON Encoding]] - Handling JSON in handlers
- [[Chi Router]] - Routing framework
- [[Error Handling]] - Error patterns
- [[Testing Patterns]] - Handler testing

## References
- [net/http package](https://pkg.go.dev/net/http)
- [Chi router](https://github.com/go-chi/chi)
- Our project: `internal/handler/game_handler.go`

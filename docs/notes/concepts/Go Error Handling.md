# Go Error Handling

## Overview
Error handling in Go is explicit and idiomatic. Unlike exceptions in other languages, Go uses multiple return values and sentinel errors.

## Basic Error Pattern

### The Error Interface
```go
type error interface {
    Error() string
}
```

Any type that implements `Error() string` is an error.

### Standard Error Handling
```go
result, err := someFunction()
if err != nil {
    // Handle error
    return err
}
// Use result
```

## Creating Errors

### 1. Simple Errors
```go
import "errors"

// At package level
var ErrNotFound = errors.New("not found")

// In function
if user == nil {
    return errors.New("user not found")
}
```

### 2. Formatted Errors
```go
import "fmt"

err := fmt.Errorf("user %s not found", username)
err := fmt.Errorf("invalid status: %s", status)
```

### 3. Error Wrapping (Go 1.13+)
```go
// Wrap with context
if err != nil {
    return fmt.Errorf("failed to get user: %w", err)
}

// Unwrap to check original error
if errors.Is(err, sql.ErrNoRows) {
    // Handle specifically
}
```

## Error Patterns in Our Project

### 1. Sentinel Errors
```go
// internal/service/game_service.go
var (
    ErrEmptyGameID        = errors.New("game ID cannot be empty")
    ErrEmptyModeratorID   = errors.New("moderator ID cannot be empty")
    ErrNotAuthorized      = errors.New("not authorized to perform this action")
    ErrEmptyUserID        = errors.New("user ID cannot be empty")
    ErrEmptyPlayerID      = errors.New("player ID cannot be empty")
    ErrPlayerNameExists   = errors.New("player name already exists in this game")
    ErrGameAlreadyStarted = errors.New("game has already started")
)
```

**When to use:**
- Expected errors that callers need to check
- Clear error messages
- No dynamic data needed

### 2. Service Layer Error Handling
```go
func (s *GameService) GetGameByID(ctx context.Context, gameID string) (*ent.Game, error) {
    // Validate input
    if gameID == "" {
        return nil, ErrEmptyGameID
    }
    
    // Call database
    game, err := s.client.Game.Get(ctx, gameID)
    if err != nil {
        // Could wrap for context
        return nil, fmt.Errorf("failed to get game: %w", err)
        // Or return as-is if error is clear enough
        return nil, err
    }
    
    return game, nil
}
```

### 3. Handler Layer Error Mapping
```go
func (h *GameHandler) GetGame(w http.ResponseWriter, r *http.Request) {
    gameID := chi.URLParam(r, "id")
    
    game, err := h.gameService.GetGameByID(r.Context(), gameID)
    if err != nil {
        // Map specific errors to HTTP status codes
        if errors.Is(err, service.ErrEmptyGameID) {
            ErrorResponse(w, http.StatusBadRequest, err.Error())
            return
        }
        // Generic error
        ErrorResponse(w, http.StatusNotFound, "game not found")
        return
    }
    
    JSONResponse(w, http.StatusOK, gameToJSON(game))
}
```

### 4. Database Error Handling
```go
func (s *GameService) JoinGame(ctx context.Context, gameID string, userName string) (*ent.Player, error) {
    player, err := s.client.Player.
        Create().
        SetName(userName).
        SetGameID(gameID).
        Save(ctx)
    
    if err != nil {
        // Check for specific database errors
        if strings.Contains(err.Error(), "duplicate key") || 
           strings.Contains(err.Error(), "unique constraint") {
            return nil, ErrPlayerNameExists
        }
        return nil, err
    }
    
    return player, nil
}
```

## Error Checking Patterns

### 1. errors.Is() - Check Wrapped Errors
```go
if errors.Is(err, service.ErrPlayerNameExists) {
    ErrorResponse(w, http.StatusConflict, err.Error())
    return
}
```

**How it works:**
```go
// Can detect error through wrapping chain
err := fmt.Errorf("outer: %w", ErrNotFound)
errors.Is(err, ErrNotFound) // true!
```

### 2. errors.As() - Extract Error Type
```go
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    // Work with specific error type
    log.Printf("validation failed: %v", validationErr.Fields)
}
```

### 3. Direct Comparison (Older Pattern)
```go
if err == ErrNotFound {
    // Handle not found
}
```

**Note:** Only works for direct comparison, doesn't work through wrapping.

## Custom Error Types

### 1. Simple Custom Error
```go
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

// Usage
if username == "" {
    return &ValidationError{
        Field:   "username",
        Message: "cannot be empty",
    }
}
```

### 2. Error with Context
```go
type GameError struct {
    GameID  string
    Op      string
    Err     error
}

func (e *GameError) Error() string {
    return fmt.Sprintf("game %s: %s: %v", e.GameID, e.Op, e.Err)
}

func (e *GameError) Unwrap() error {
    return e.Err
}

// Usage
return &GameError{
    GameID: gameID,
    Op:     "join",
    Err:    ErrGameAlreadyStarted,
}
```

## Error Handling in Different Layers

### 1. Database Layer
```go
// Return database errors as-is or wrap
func (r *Repository) GetUser(id string) (*User, error) {
    user, err := r.db.GetUser(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}
```

### 2. Service Layer
```go
// Business logic errors
func (s *GameService) UpdateGameStatus(ctx context.Context, gameID string, status game.Status, moderatorID string) (*ent.Game, error) {
    if gameID == "" {
        return nil, ErrEmptyGameID
    }
    if moderatorID == "" {
        return nil, ErrEmptyModeratorID
    }
    
    existingGame, err := s.GetGameByID(ctx, gameID)
    if err != nil {
        return nil, err
    }
    
    if existingGame.ModeratorID != moderatorID {
        return nil, ErrNotAuthorized
    }
    
    // ...
}
```

### 3. Handler Layer
```go
// Map to HTTP status codes
func (h *GameHandler) UpdateGameStatus(w http.ResponseWriter, r *http.Request) {
    // ... decode request ...
    
    updated, err := h.gameService.UpdateGameStatus(r.Context(), gameID, req.Status, moderatorID)
    if err != nil {
        if errors.Is(err, service.ErrNotAuthorized) {
            ErrorResponse(w, http.StatusForbidden, err.Error())
            return
        }
        if errors.Is(err, service.ErrEmptyGameID) || errors.Is(err, service.ErrEmptyModeratorID) {
            ErrorResponse(w, http.StatusBadRequest, err.Error())
            return
        }
        ErrorResponse(w, http.StatusNotFound, "game not found")
        return
    }
    
    JSONResponse(w, http.StatusOK, gameToJSON(updated))
}
```

## Error Response Patterns

### 1. Simple Error Response
```go
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
    JSONResponse(w, statusCode, map[string]string{
        "error": message,
    })
}
```

### 2. Detailed Error Response
```go
type ErrorResponse struct {
    Error   string            `json:"error"`
    Code    string            `json:"code"`
    Details map[string]string `json:"details,omitempty"`
}

func DetailedError(w http.ResponseWriter, statusCode int, code string, message string) {
    JSONResponse(w, statusCode, ErrorResponse{
        Error: message,
        Code:  code,
    })
}
```

### 3. Validation Error Response
```go
type ValidationErrorResponse struct {
    Error  string              `json:"error"`
    Fields map[string][]string `json:"fields"`
}

func ValidationError(w http.ResponseWriter, fields map[string][]string) {
    JSONResponse(w, http.StatusBadRequest, ValidationErrorResponse{
        Error:  "validation failed",
        Fields: fields,
    })
}
```

## Testing Error Handling

### 1. Testing Service Errors
```go
func TestGameService_GetGameByID(t *testing.T) {
    t.Run("returns error for empty ID", func(t *testing.T) {
        _, err := service.GetGameByID(ctx, "")
        
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "game ID")
    })
    
    t.Run("returns error for non-existent game", func(t *testing.T) {
        _, err := service.GetGameByID(ctx, "NOEXIST")
        
        assert.Error(t, err)
    })
}
```

### 2. Testing Handler Error Responses
```go
func TestJoinGameHandler(t *testing.T) {
    t.Run("returns 409 for duplicate name", func(t *testing.T) {
        // First join succeeds
        req := httptest.NewRequest("POST", "/api/games/ABC123/join", 
            bytes.NewReader([]byte(`{"name":"player1"}`)))
        rr := httptest.NewRecorder()
        handler.JoinGame(rr, req)
        assert.Equal(t, http.StatusOK, rr.Code)
        
        // Second join fails
        req = httptest.NewRequest("POST", "/api/games/ABC123/join",
            bytes.NewReader([]byte(`{"name":"player1"}`)))
        rr = httptest.NewRecorder()
        handler.JoinGame(rr, req)
        assert.Equal(t, http.StatusConflict, rr.Code)
    })
}
```

## Best Practices

### 1. Be Explicit
```go
// Good - Clear what's being checked
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}

// Avoid - Silent failure
_ = createUser()
```

### 2. Add Context When Wrapping
```go
// Good
if err != nil {
    return fmt.Errorf("failed to get user %s: %w", userID, err)
}

// Less helpful
if err != nil {
    return err
}
```

### 3. Don't Panic in Production Code
```go
// Bad
if err != nil {
    panic(err)
}

// Good
if err != nil {
    log.Printf("error: %v", err)
    return err
}
```

**Exception:** `panic()` is okay for:
- Initialization errors (package init)
- Programming errors (nil pointer that should never happen)
- Test helpers

### 4. Check Errors Immediately
```go
// Good
result, err := doSomething()
if err != nil {
    return err
}
use(result)

// Bad - Don't defer error checking
result, err := doSomething()
// ... lots of code ...
if err != nil {
    return err
}
```

### 5. Don't Log and Return
```go
// Bad - Caller will likely log too
if err != nil {
    log.Printf("error: %v", err)
    return err
}

// Good - Let caller decide to log
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}

// Or log at top level only
if err := run(); err != nil {
    log.Fatalf("fatal: %v", err)
}
```

### 6. Use Sentinel Errors for Expected Cases
```go
// Good - Explicit error for expected case
var ErrGameAlreadyStarted = errors.New("game has already started")

if game.Status != "pending" {
    return ErrGameAlreadyStarted
}

// Bad - Generic error for specific case
if game.Status != "pending" {
    return errors.New("cannot join")
}
```

## Common Error Handling Patterns

### 1. Early Return Pattern
```go
func (s *Service) DoSomething(id string) error {
    // Validate
    if id == "" {
        return ErrEmptyID
    }
    
    // Get resource
    resource, err := s.Get(id)
    if err != nil {
        return err
    }
    
    // Check state
    if !resource.IsValid() {
        return ErrInvalidState
    }
    
    // Do work
    return s.process(resource)
}
```

### 2. Error Accumulation
```go
type MultiError []error

func (m MultiError) Error() string {
    var msgs []string
    for _, err := range m {
        msgs = append(msgs, err.Error())
    }
    return strings.Join(msgs, "; ")
}

func validate(user *User) error {
    var errs MultiError
    
    if user.Name == "" {
        errs = append(errs, errors.New("name required"))
    }
    if user.Email == "" {
        errs = append(errs, errors.New("email required"))
    }
    
    if len(errs) > 0 {
        return errs
    }
    return nil
}
```

### 3. Cleanup with Defer
```go
func process(filename string) error {
    f, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer f.Close() // Always cleanup
    
    // Process file
    data, err := io.ReadAll(f)
    if err != nil {
        return fmt.Errorf("read file: %w", err)
    }
    
    return processData(data)
}
```

## Error to HTTP Status Code Mapping

```go
var (
    ErrEmptyInput         -> 400 Bad Request
    ErrPlayerNameExists   -> 409 Conflict
    ErrGameAlreadyStarted -> 400 Bad Request
    ErrNotAuthorized      -> 403 Forbidden
    ErrNotFound           -> 404 Not Found
    sql.ErrNoRows         -> 404 Not Found
    context.DeadlineExceeded -> 504 Gateway Timeout
    Generic errors        -> 500 Internal Server Error
)
```

## Related Concepts
- [[Go HTTP Handlers]] - Error handling in handlers
- [[Go JSON Encoding]] - Encoding error responses
- [[Testing Patterns]] - Testing error cases

## References
- [Go blog: Error handling](https://go.dev/blog/error-handling-and-go)
- [errors package](https://pkg.go.dev/errors)
- Our project: `internal/service/game_service.go`, `internal/handler/game_handler.go`

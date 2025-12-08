# Go JSON Encoding & Marshaling

## Overview
JSON encoding and decoding in Go is handled by the `encoding/json` package. Understanding how Go converts structs to JSON and vice versa is crucial for building REST APIs.

## Core Concepts

### Marshaling vs Encoding
- **Marshaling**: Converting Go data structures to JSON bytes (`json.Marshal`)
- **Encoding**: Writing JSON directly to an io.Writer (e.g., http.ResponseWriter) using `json.Encoder`

```go
// Marshaling - returns []byte
data, err := json.Marshal(obj)

// Encoding - writes directly to Writer
encoder := json.NewEncoder(w)
err := encoder.Encode(obj)
```

### Unmarshaling vs Decoding
- **Unmarshaling**: Converting JSON bytes to Go data structures (`json.Unmarshal`)
- **Decoding**: Reading JSON directly from an io.Reader using `json.Decoder`

```go
// Unmarshaling - from []byte
err := json.Unmarshal(data, &obj)

// Decoding - from Reader (e.g., http.Request.Body)
decoder := json.NewDecoder(r.Body)
err := decoder.Decode(&obj)
```

## JSON Struct Tags

### Basic Tag Syntax
```go
type Player struct {
    ID        uuid.UUID `json:"id"`
    Name      string    `json:"name"`
    GameID    string    `json:"game_id"`
    CreatedAt time.Time `json:"created_at"`
}
```

### Common Tag Options

#### `omitempty` - Omit Zero Values
```go
type Game struct {
    ID          string    `json:"id"`
    ModeratorID string    `json:"moderator_id"`
    Status      string    `json:"status,omitempty"` // Omitted if empty string
}
```

#### `-` - Ignore Field
```go
type User struct {
    Username string `json:"username"`
    Password string `json:"-"` // Never serialized to JSON
}
```

#### Renaming Fields
```go
type Response struct {
    UserID   int    `json:"user_id"`   // user_id in JSON
    FullName string `json:"full_name"` // full_name in JSON
}
```

## Practical Examples from Our Project

### 1. Request Decoding (Handler Pattern)
```go
func (h *GameHandler) JoinGame(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Name string `json:"name"`
    }
    
    // Decode JSON from request body
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        ErrorResponse(w, http.StatusBadRequest, "invalid request body")
        return
    }
    
    // Use decoded data
    player, err := h.gameService.JoinGame(r.Context(), gameID, req.Name)
    // ...
}
```

**Why use Decoder here?**
- More efficient for reading from streams (http.Request.Body)
- Avoids loading entire JSON into memory
- Built-in error handling for malformed JSON

### 2. Response Encoding (Handler Pattern)
```go
func JSONResponse(w http.ResponseWriter, statusCode int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    json.NewEncoder(w).Encode(data)
}
```

**Why use Encoder here?**
- Writes directly to http.ResponseWriter
- No intermediate byte slice needed
- More efficient for large responses

### 3. Converting Ent Models to JSON
```go
func playerToJSON(p *ent.Player) map[string]any {
    return map[string]any{
        "id":         p.ID,
        "name":       p.Name,
        "game_id":    p.GameID,
        "created_at": p.CreatedAt,
    }
}
```

**Why use `map[string]any` instead of struct?**
- Flexibility: Can dynamically include/exclude fields
- Avoids creating many response struct types
- Ent models may have circular references (edges)

## Advanced Patterns

### Custom JSON Marshaling
```go
type Status string

const (
    StatusPending   Status = "pending"
    StatusActive    Status = "active"
    StatusCompleted Status = "completed"
)

// Status already marshals correctly as a string type alias
// But if you needed custom behavior:
func (s Status) MarshalJSON() ([]byte, error) {
    return json.Marshal(string(s))
}
```

### Handling Nested Structures
```go
type GameResponse struct {
    ID      string           `json:"id"`
    Status  string           `json:"status"`
    Players []PlayerResponse `json:"players"`
}

type PlayerResponse struct {
    ID   uuid.UUID `json:"id"`
    Name string    `json:"name"`
}
```

### Anonymous Structs for One-Off Requests
```go
// Good for one-time use in handlers
var req struct {
    Status game.Status `json:"status"`
}

err := json.NewDecoder(r.Body).Decode(&req)
```

## Performance Considerations

### Marshal vs Encoder Performance
```go
// Slower - creates intermediate byte slice
data, _ := json.Marshal(obj)
w.Write(data)

// Faster - writes directly
json.NewEncoder(w).Encode(obj)
```

### Unmarshal vs Decoder Performance
```go
// When you have []byte, use Unmarshal
json.Unmarshal(data, &obj)

// When you have io.Reader, use Decoder
json.NewDecoder(reader).Decode(&obj)
```

## Common Pitfalls

### 1. Unexported Fields
```go
type User struct {
    name string // Won't be marshaled (lowercase = unexported)
    Name string // Will be marshaled
}
```

### 2. Pointer vs Value
```go
// These behave differently with omitempty
type Example struct {
    Count  int  `json:"count,omitempty"`   // Omits if 0
    CountP *int `json:"countp,omitempty"`  // Omits if nil
}
```

### 3. Time Formatting
```go
type Event struct {
    CreatedAt time.Time `json:"created_at"` // RFC3339 format by default
}

// Output: "2024-12-08T20:23:03Z"
```

### 4. UUID Handling
```go
import "github.com/google/uuid"

type Player struct {
    ID uuid.UUID `json:"id"` // Marshals to string automatically
}
```

## Testing JSON Responses

### Example from Our Tests
```go
func TestJoinGameHandler(t *testing.T) {
    // ... setup ...
    
    rr := httptest.NewRecorder()
    r.ServeHTTP(rr, req)
    
    assert.Equal(t, http.StatusOK, rr.Code)
    
    var response map[string]any
    err := json.NewDecoder(rr.Body).Decode(&response)
    require.NoError(t, err)
    
    assert.Equal(t, "player1", response["name"])
}
```

## Best Practices

### 1. Use Struct Tags Consistently
```go
// Good - consistent naming
type Game struct {
    ID          string `json:"id"`
    ModeratorID string `json:"moderator_id"`
    CreatedAt   time.Time `json:"created_at"`
}
```

### 2. Validate After Decoding
```go
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    return err
}

if req.Name == "" {
    return errors.New("name is required")
}
```

### 3. Set Content-Type Header
```go
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(statusCode)
json.NewEncoder(w).Encode(data)
```

### 4. Close Request Body
```go
defer r.Body.Close()
err := json.NewDecoder(r.Body).Decode(&req)
```

### 5. Handle Encoding Errors
```go
if err := json.NewEncoder(w).Encode(data); err != nil {
    log.Printf("failed to encode response: %v", err)
    // Response already started, can't change status code
}
```

## Related Concepts
- [[HTTP Handlers]] - How JSON fits in HTTP handlers
- [[Ent ORM]] - Converting database models to JSON
- [[Error Handling]] - Proper error responses in JSON
- [[Testing Patterns]] - Testing JSON endpoints

## References
- [Go json package docs](https://pkg.go.dev/encoding/json)
- [JSON and Go](https://go.dev/blog/json) - Official Go blog
- Our project: `internal/handler/response.go`, `internal/handler/game_handler.go`

# Chi Router

**Decision Date:** 2025-12-06  
**Status:** Adopted for Phase 3  
**Repository:** https://github.com/go-chi/chi  
**Stars:** 18.5k+ ⭐

## Overview

Chi is a lightweight, idiomatic, and composable router for building Go HTTP services. It's 100% compatible with Go's `net/http` standard library.

## Why Chi?

### Decision Context
When implementing Phase 3 (Game Creation & Management API), we needed to choose an HTTP router for our REST API endpoints.

### Evaluated Options
1. **stdlib (Go 1.22+)** - Built-in routing with method support
2. **chi** - Lightweight, stdlib-compatible router
3. **Gin** - Full-featured web framework
4. **Echo** - High performance minimalist framework
5. **Fiber** - Express-inspired, uses fasthttp
6. **Gorilla Mux** - ⚠️ Archived (not maintained)

### Selection Criteria
- ✅ Lightweight and minimal dependencies
- ✅ Standard library compatibility
- ✅ Easy to test
- ✅ Good middleware support
- ✅ Clean route grouping
- ✅ Production-ready

## Why Chi Won

| Feature | Chi | Stdlib | Gin | Fiber |
|---------|-----|--------|-----|-------|
| Dependencies | Zero | N/A | Many | Many |
| Stdlib Compatible | ✅ | ✅ | ❌ | ❌ |
| Middleware | ✅✅ | ❌ | ✅✅ | ✅✅ |
| Route Groups | ✅ | ❌ | ✅ | ✅ |
| Learning Curve | Low | Lowest | Medium | Medium |
| Performance | Fast | Fastest | Very Fast | Fastest |
| Production Use | GitHub, Cloudflare | Everywhere | Huge | Growing |

### Key Advantages
1. **Lightweight** - Core is ~100 lines of code
2. **Stdlib compatible** - Can switch to stdlib later if needed
3. **Great middleware** - Logger, Recoverer, CORS, RequestID
4. **Clean routing** - Nested routes and groups
5. **Context-based params** - `chi.URLParam(r, "id")`
6. **Battle-tested** - Used by GitHub, Cloudflare, and many others

### Trade-offs Accepted
- One external dependency (acceptable for the benefits)
- Slightly slower than stdlib (negligible for our use case)
- Need to learn chi API (minimal learning curve)

## Installation

```bash
go get -u github.com/go-chi/chi/v5
```

## Usage in Mafia Night

### Basic Setup

```go
package main

import (
    "net/http"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()
    
    // Middleware
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.RequestID)
    
    // Health check
    r.Get("/health", healthHandler)
    
    // API routes
    r.Route("/api", func(r chi.Router) {
        r.Route("/games", func(r chi.Router) {
            r.Post("/", createGame)
            r.Get("/{id}", getGame)
            r.Patch("/{id}", updateGame)
            r.Delete("/{id}", deleteGame)
            
            // Nested routes
            r.Post("/{id}/join", joinGame)
            r.Get("/{id}/players", getPlayers)
        })
    })
    
    http.ListenAndServe(":8080", r)
}
```

### Route Parameters

```go
func getGame(w http.ResponseWriter, r *http.Request) {
    gameID := chi.URLParam(r, "id")
    // Use gameID...
}
```

### Middleware

```go
// Built-in middleware
r.Use(middleware.Logger)       // Request logging
r.Use(middleware.Recoverer)    // Panic recovery
r.Use(middleware.RequestID)    // Request ID tracking
r.Use(middleware.RealIP)       // Real IP detection
r.Use(middleware.Timeout(60 * time.Second))

// Custom middleware
r.Use(func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Before request
        next.ServeHTTP(w, r)
        // After request
    })
})
```

### Route Groups

```go
r.Route("/api", func(r chi.Router) {
    // Middleware only for /api/* routes
    r.Use(authMiddleware)
    
    r.Route("/games", func(r chi.Router) {
        // All game-related routes
    })
    
    r.Route("/players", func(r chi.Router) {
        // All player-related routes
    })
})
```

## Testing with Chi

Chi handlers are standard `http.Handler`, so testing is simple:

```go
func TestCreateGame(t *testing.T) {
    r := chi.NewRouter()
    r.Post("/api/games", createGameHandler)
    
    req := httptest.NewRequest("POST", "/api/games", body)
    rr := httptest.NewRecorder()
    
    r.ServeHTTP(rr, req)
    
    assert.Equal(t, http.StatusCreated, rr.Code)
}
```

## Middleware Recommendations

### Essential Middleware
```go
r.Use(middleware.RequestID)   // Tracking requests
r.Use(middleware.RealIP)      // Get real client IP
r.Use(middleware.Logger)      // Request logging
r.Use(middleware.Recoverer)   // Panic recovery
```

### Optional Middleware
```go
r.Use(middleware.Timeout(60 * time.Second))  // Request timeout
r.Use(middleware.Throttle(100))              // Rate limiting
r.Use(middleware.Compress(5))                // Gzip compression
r.Use(cors.Handler(corsOptions))             // CORS support
```

## API Design Pattern

Our REST API structure with Chi:

```
/health                          GET    - Health check
/api/games                       POST   - Create game
/api/games/{id}                  GET    - Get game
/api/games/{id}                  PATCH  - Update game
/api/games/{id}                  DELETE - Delete game
/api/games/{id}/join             POST   - Join game
/api/games/{id}/players          GET    - List players
/api/games/{id}/players/{pid}    DELETE - Remove player
/api/games/{id}/distribute       POST   - Distribute roles
```

## Resources

- **Documentation:** https://github.com/go-chi/chi
- **Examples:** https://github.com/go-chi/chi/tree/master/_examples
- **Middleware:** https://github.com/go-chi/chi#middlewares
- **Community:** Active GitHub community

## Related Tools

- [[Go Language]] - Programming language
- [[Backend Architecture]] - Overall architecture
- [[PostgreSQL]] - Database
- [[Ent ORM]] - ORM layer

## Phase Usage

- **Phase 3:** Game Creation & Management API ← Starting here
- **Phase 4:** Player Join & Registration API
- **Phase 7:** Telegram Bot Webhooks
- **Phase 8:** Moderator Dashboard API
- **Phase 9:** Player Interface API

## Future Considerations

### If We Outgrow Chi
- Could switch to stdlib (Go 1.22+) - code changes are minimal
- Could upgrade to Gin if we need more built-in features
- Chi is likely sufficient for entire project

### Performance
- Chi is fast enough for our scale
- If we hit performance issues, profile first
- Routing is rarely the bottleneck

## Notes

- Chi v5 is the current stable version
- Zero breaking changes in v5 lifecycle
- Excellent backward compatibility record
- Used in production by major companies

---

**Last Updated:** 2025-12-06  
**Phase:** Phase 3 - Game Management API

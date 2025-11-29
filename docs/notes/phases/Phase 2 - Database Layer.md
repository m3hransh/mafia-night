# Phase 2 - Database Layer

⏳ **Status: IN PROGRESS**

Implement core data models and database operations using Ent ORM.

## Goals

- [x] Define domain models (Internal & Ent Schemas)
- [x] Create [[PostgreSQL]] schema (via Ent)
- [ ] Implement repository pattern (Game ✅, Player ⏳, Role ⏳)
- [x] Set up database migrations (Ent Auto-migration)
- [ ] 100% test coverage

## Implemented Models

### Game
```go
// Internal Model
type Game struct {
    ID          string     `json:"id"`
    Status      GameStatus `json:"status"`
    ModeratorID uuid.UUID  `json:"moderator_id"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}
```

### Player
```go
// Internal Model
type Player struct {
    ID         uuid.UUID `json:"id"`
    Name       string    `json:"name"`
    TelegramID string    `json:"telegram_id"`
    GameID     string    `json:"game_id"`
    CreatedAt  time.Time `json:"created_at"`
}
```

### Role
```go
// Internal Model
type Role struct {
    ID          uuid.UUID `json:"id"`
    Name        string    `json:"name"`
    Team        Team      `json:"team"`
    Description string    `json:"description"`
    CreatedAt   time.Time `json:"created_at"`
}
```

### GameRole
```go
// Internal Model
type GameRole struct {
    GameID     string    `json:"game_id"`
    PlayerID   uuid.UUID `json:"player_id"`
    RoleID     uuid.UUID `json:"role_id"`
    AssignedAt time.Time `json:"assigned_at"`
}
```

## Database Schema (Ent)

The schema is defined in `backend/ent/schema`.

- **Games**: ID (String/12), Status (Enum), ModeratorID (String), CreatedAt (Time)
- **Players**: ID (UUID), Name (String), TelegramID (String), GameID (String), CreatedAt (Time)
- **Roles**: ID (UUID), Name (String), Team (Enum), Abilities (Text)
- **GameRoles**: GameID (String), PlayerID (UUID), RoleID (UUID), AssignedAt (Time)

Relationships:
- Game -> Players (One-to-Many, Cascade Delete)
- Game -> GameRoles (One-to-Many, Cascade Delete)
- Player -> GameRole (One-to-One)
- Role -> GameRoles (One-to-Many)

## Repository Pattern

We use a repository layer to decouple Ent implementation from the service layer.

### Interface
```go
type GameRepository interface {
    Create(ctx context.Context, game *models.Game) error
    GetByID(ctx context.Context, id string) (*models.Game, error)
    Update(ctx context.Context, game *models.Game) error
    Delete(ctx context.Context, id string) error
    ListByStatus(ctx context.Context, status models.GameStatus) ([]*models.Game, error)
}
```

### Implementation (Ent)
```go
type PostgresGameRepository struct {
    client *ent.Client
}

func (r *PostgresGameRepository) Create(ctx context.Context, g *models.Game) error {
    created, err := r.client.Game.
        Create().
        SetID(g.ID).
        SetStatus(game.Status(g.Status)).
        SetModeratorID(g.ModeratorID.String()).
        Save(ctx)
    // ...
}
```

## Migration System

Using Ent's Auto-Migration feature for development and testing.
Production migration strategy to be finalized (likely `atlas` or `ent` versioned migrations).

## Testing Strategy

- **Unit Tests**: `internal/models` (validate business logic)
- **Integration Tests**: `internal/repository` (test against real DB via Ent)
- **Test DB**: A separate PostgreSQL database is spun up for tests using Docker/Just.

## Remaining Tasks

### Player Model
- [ ] Implement: PlayerRepository
- [ ] Refactor: `player_repository_test.go` to use Repository interface

### Role Model
- [ ] Implement: RoleRepository
- [ ] Refactor: `role_repository_test.go` to use Repository interface

### GameRole Model
- [ ] Implement: GameRoleRepository (if needed, or part of Game/Player repos)

## Related Notes

- [[Phase 1 - Infrastructure]] - Previous phase
- [[Phase 3 - Game API]] - Next phase
- [[Ent ORM]] - Database tool
- [[TDD Approach]] - Testing methodology

---

#phase2 #database #inprogress #models #ent
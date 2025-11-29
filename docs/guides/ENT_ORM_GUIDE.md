# Ent ORM Guide - Complete Tutorial

## What is Ent?

Ent is a **modern, type-safe ORM** for Go created by Facebook. It's the most advanced database library for Go in 2024/2025.

**Key Features:**
- 🔐 **Type-safe**: All database operations checked at compile time
- 🚀 **Fast**: No reflection, pure code generation
- 📊 **Graph-based**: Models relationships naturally
- 🔄 **Auto-migrations**: Generate SQL from Go structs
- 🧪 **Testable**: Built-in testing utilities
- 📝 **Well-documented**: Excellent docs and examples

---

## Why We Chose Ent Over Others

| Feature | Manual SQL | GORM | sqlc | **Ent** |
|---------|-----------|------|------|---------|
| Type Safety | ❌ Runtime | ⚠️ Runtime | ✅ Compile | ✅ Compile |
| Auto-Migrations | ❌ Manual | ✅ Yes | ❌ Manual | ✅ Yes |
| Performance | ⚡⚡⚡ Best | ⚡⚡ Good | ⚡⚡⚡ Best | ⚡⚡⚡ Best |
| Code Gen | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| Graph Queries | ❌ No | ⚠️ Limited | ❌ No | ✅ Excellent |
| Learning Curve | Easy | Easy | Medium | Medium |
| Maintained By | - | Community | Community | **Facebook** |

**Verdict:** Ent gives us GORM's productivity with sqlc's performance! 🎉

---

## Project Structure

```
backend/
├── ent/                    # Generated code (DO NOT EDIT!)
│   ├── client.go          # Main Ent client
│   ├── schema/            # Our schema definitions (WE EDIT THESE!)
│   │   ├── game.go        # Game entity definition
│   │   ├── player.go      # Player entity definition
│   │   ├── role.go        # Role entity definition
│   │   └── gamerole.go    # GameRole entity definition
│   ├── game*.go           # Generated Game CRUD
│   ├── player*.go         # Generated Player CRUD
│   ├── role*.go           # Generated Role CRUD
│   └── gamerole*.go       # Generated GameRole CRUD
│
├── internal/
│   ├── database/
│   │   └── ent.go         # Ent client setup
│   └── models/            # Business logic (unchanged)
│
└── cmd/
    └── migrate/           # Migration command
        └── main.go
```

---

## How Ent Works

### 1. Define Schema (We Write)

```go
// ent/schema/game.go
package schema

import (
    "entgo.io/ent"
    "entgo.io/ent/schema/field"
    "entgo.io/ent/schema/edge"
)

type Game struct {
    ent.Schema
}

// Fields defines the database columns
func (Game) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(uuid.New),
        field.Enum("status").Values("pending", "in_progress", "completed"),
        field.UUID("moderator_id", uuid.UUID{}),
        field.Time("created_at").Default(time.Now),
        field.Time("updated_at").UpdateDefault(time.Now),
    }
}

// Edges defines relationships
func (Game) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("players", Player.Type),
        edge.To("game_roles", GameRole.Type),
    }
}
```

### 2. Generate Code

```bash
# One command generates everything!
go generate ./ent

# Or use Just
just ent-generate
```

**Generates:**
- Type-safe CRUD operations
- Query builders
- Migrations
- Testing utilities
- ~2000 lines of code per entity!

### 3. Use Generated Code

```go
// Create a game
game, err := client.Game.Create().
    SetModeratorID(modID).
    SetStatus("pending").
    Save(ctx)

// Query with type safety
games, err := client.Game.Query().
    Where(game.StatusEQ("pending")).
    All(ctx)

// Update
_, err = client.Game.UpdateOneID(gameID).
    SetStatus("in_progress").
    Save(ctx)

// Delete
err = client.Game.DeleteOneID(gameID).Exec(ctx)
```

---

## Schema Definition Deep Dive

### Fields (Columns)

```go
func (Game) Fields() []ent.Field {
    return []ent.Field{
        // UUID field with auto-generation
        field.UUID("id", uuid.UUID{}).
            Default(uuid.New).
            Immutable(),  // Can't be changed after creation
        
        // Enum with specific values
        field.Enum("status").
            Values("pending", "in_progress", "completed").
            Default("pending"),
        
        // Required UUID (no default)
        field.UUID("moderator_id", uuid.UUID{}),
        
        // Timestamps
        field.Time("created_at").
            Default(time.Now).
            Immutable(),
        field.Time("updated_at").
            Default(time.Now).
            UpdateDefault(time.Now),  // Auto-updates on save
    }
}
```

**Field Types:**
- `field.String()` - VARCHAR
- `field.Int()` - INTEGER
- `field.UUID()` - UUID
- `field.Time()` - TIMESTAMP
- `field.Enum()` - ENUM
- `field.Bool()` - BOOLEAN
- `field.JSON()` - JSONB
- `field.Text()` - TEXT

**Field Options:**
- `.Default(value)` - Default value
- `.Immutable()` - Can't be updated
- `.Optional()` - Can be NULL
- `.Unique()` - Unique constraint
- `.NotEmpty()` - Can't be empty string
- `.MaxLen(n)` - Max length

### Edges (Relationships)

```go
func (Game) Edges() []ent.Edge {
    return []ent.Edge{
        // One-to-many: Game has many Players
        edge.To("players", Player.Type),
        
        // Many-to-many through GameRole
        edge.To("game_roles", GameRole.Type),
    }
}

func (Player) Edges() []ent.Edge {
    return []ent.Edge{
        // Many-to-one: Player belongs to Game
        edge.From("game", Game.Type).
            Ref("players").        // References Game.players edge
            Field("game_id").      // Foreign key column
            Unique().              // One game per player
            Required(),            // Must have a game
    }
}
```

**Edge Types:**
- `edge.To()` - Define forward relationship
- `edge.From()` - Define reverse relationship
- `.Ref()` - Reference another edge
- `.Unique()` - One-to-one
- `.Required()` - NOT NULL

### Indexes

```go
func (Player) Indexes() []ent.Index {
    return []ent.Index{
        // Single column index
        index.Fields("game_id"),
        
        // Unique constraint on multiple columns
        index.Fields("game_id", "name").Unique(),
    }
}
```

---

## Using Ent Client

### Setup

```go
// Connect to database
client, err := database.NewEntClient(cfg)
if err != nil {
    log.Fatal(err)
}
defer client.Close()

// Auto-migrate (creates/updates tables)
ctx := context.Background()
if err := client.Schema.Create(ctx); err != nil {
    log.Fatal(err)
}
```

### Create

```go
// Simple create
game, err := client.Game.Create().
    SetModeratorID(moderatorID).
    Save(ctx)

// Create with all fields
game, err := client.Game.Create().
    SetID(uuid.New()).
    SetStatus("pending").
    SetModeratorID(moderatorID).
    SetCreatedAt(time.Now()).
    Save(ctx)

// Create multiple
games, err := client.Game.CreateBulk(
    client.Game.Create().SetModeratorID(mod1),
    client.Game.Create().SetModeratorID(mod2),
).Save(ctx)
```

### Query

```go
// Get by ID
game, err := client.Game.Get(ctx, gameID)

// Query with conditions
games, err := client.Game.Query().
    Where(game.StatusEQ("pending")).
    All(ctx)

// Multiple conditions
games, err := client.Game.Query().
    Where(
        game.StatusEQ("pending"),
        game.CreatedAtGT(yesterday),
    ).
    All(ctx)

// Limit and offset
games, err := client.Game.Query().
    Limit(10).
    Offset(20).
    All(ctx)

// Order
games, err := client.Game.Query().
    Order(ent.Asc(game.FieldCreatedAt)).
    All(ctx)

// Count
count, err := client.Game.Query().
    Where(game.StatusEQ("pending")).
    Count(ctx)

// Exist
exists, err := client.Game.Query().
    Where(game.IDEQ(gameID)).
    Exist(ctx)

// First/Only
game, err := client.Game.Query().
    Where(game.StatusEQ("pending")).
    First(ctx)  // Returns first or error
```

### Query with Edges (Relationships)

```go
// Load players with game
game, err := client.Game.Query().
    Where(game.IDEQ(gameID)).
    WithPlayers().  // Eager load
    Only(ctx)

// Now access players
for _, player := range game.Edges.Players {
    fmt.Println(player.Name)
}

// Multiple edges
game, err := client.Game.Query().
    WithPlayers().
    WithGameRoles(func(q *ent.GameRoleQuery) {
        q.WithRole()  // Nested eager loading
    }).
    Only(ctx)

// Filter through edges
games, err := client.Game.Query().
    Where(game.HasPlayersWith(
        player.NameContains("Alice"),
    )).
    All(ctx)
```

### Update

```go
// Update one
game, err := client.Game.UpdateOneID(gameID).
    SetStatus("in_progress").
    Save(ctx)

// Update many
count, err := client.Game.Update().
    Where(game.StatusEQ("pending")).
    SetStatus("cancelled").
    Save(ctx)

// Update with conditions
_, err = client.Game.UpdateOneID(gameID).
    Where(game.StatusEQ("pending")).  // Only if pending
    SetStatus("in_progress").
    Save(ctx)
```

### Delete

```go
// Delete one
err := client.Game.DeleteOneID(gameID).Exec(ctx)

// Delete many
count, err := client.Game.Delete().
    Where(game.StatusEQ("completed")).
    Exec(ctx)
```

### Transactions

```go
// Start transaction
tx, err := client.Tx(ctx)
if err != nil {
    return err
}

// Do operations
game, err := tx.Game.Create().
    SetModeratorID(modID).
    Save(ctx)
if err != nil {
    return tx.Rollback()
}

player, err := tx.Player.Create().
    SetName("Alice").
    SetGameID(game.ID).
    Save(ctx)
if err != nil {
    return tx.Rollback()
}

// Commit
return tx.Commit()
```

---

## Migrations

### Auto-Migration (Development)

```bash
# Run migration
just db-migrate

# Or directly
go run ./cmd/migrate
```

**What it does:**
1. Connects to database
2. Compares schema to database
3. Creates/alters tables automatically
4. Creates indexes
5. Adds constraints

**Generated SQL** (example):
```sql
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY,
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed')),
    moderator_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_moderator_id ON games(moderator_id);
CREATE INDEX idx_games_status ON games(status);
```

### Atlas (Production)

For production, use Atlas to generate versioned migrations:

```bash
# Install Atlas
curl -sSf https://atlasgo.sh | sh

# Generate migration
atlas migrate diff \
  --dir "file://migrations" \
  --to "ent://ent/schema" \
  --dev-url "docker://postgres/15"

# Apply
atlas migrate apply \
  --url "postgres://user:pass@localhost:5432/db"
```

---

## Testing with Ent

```go
func TestGameCreate(t *testing.T) {
    // Create in-memory SQLite client for testing
    client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
    defer client.Close()
    
    ctx := context.Background()
    
    // Create test data
    game := client.Game.Create().
        SetModeratorID(uuid.New()).
        SaveX(ctx)
    
    // Assert
    assert.NotEqual(t, uuid.Nil, game.ID)
    assert.Equal(t, "pending", game.Status)
}
```

---

## Common Patterns

### Create Game with Players

```go
game, err := client.Game.Create().
    SetModeratorID(moderatorID).
    AddPlayers(
        client.Player.Create().
            SetName("Alice").
            SetTelegramID("alice123"),
        client.Player.Create().
            SetName("Bob").
            SetTelegramID("bob456"),
    ).
    Save(ctx)
```

### Assign Roles to Players

```go
// Get game with players
game, err := client.Game.Query().
    Where(game.IDEQ(gameID)).
    WithPlayers().
    Only(ctx)

// Get available roles
roles, err := client.Role.Query().All(ctx)

// Assign roles
for i, player := range game.Edges.Players {
    _, err := client.GameRole.Create().
        SetGameID(gameID).
        SetPlayerID(player.ID).
        SetRoleID(roles[i%len(roles)].ID).
        Save(ctx)
}
```

### Get Game with All Data

```go
game, err := client.Game.Query().
    Where(game.IDEQ(gameID)).
    WithPlayers().
    WithGameRoles(func(q *ent.GameRoleQuery) {
        q.WithPlayer().
          WithRole()
    }).
    Only(ctx)

// Access nested data
for _, gr := range game.Edges.GameRoles {
    fmt.Printf("%s has role %s\n",
        gr.Edges.Player.Name,
        gr.Edges.Role.Name)
}
```

---

## Commands Reference

```bash
# Generate Ent code
go generate ./ent
# or
just ent-generate

# Run migrations
just db-migrate

# Seed data
just db-seed

# Reset database
just db-reset

# Connect to database
just db-connect
```

---

## Tips & Best Practices

### 1. Always Use Context
```go
// ❌ Bad
game, err := client.Game.Get(gameID)

// ✅ Good
ctx := context.Background()
game, err := client.Game.Get(ctx, gameID)
```

### 2. Use SaveX for Tests
```go
// Save returns (entity, error)
game, err := client.Game.Create().Save(ctx)

// SaveX panics on error (good for tests)
game := client.Game.Create().SaveX(ctx)
```

### 3. Check Edges Exist
```go
game, err := client.Game.Query().
    WithPlayers().
    Only(ctx)

if game.Edges.Players != nil {
    // Safe to use
}
```

### 4. Use Transactions for Multiple Operations
```go
tx, err := client.Tx(ctx)
// ... do operations ...
tx.Commit()
```

---

## Next Steps

Now that you understand Ent:

1. **Explore Generated Code**: Look at `ent/game.go` to see what Ent generated
2. **Run Migration**: `just db-migrate` to create tables
3. **Test Queries**: Try creating and querying games
4. **Build Repository Layer**: Wrap Ent client in repository pattern

---

## Resources

- [Official Docs](https://entgo.io/docs/getting-started)
- [Schema Guide](https://entgo.io/docs/schema-def)
- [Query Guide](https://entgo.io/docs/crud)
- [Migration Guide](https://entgo.io/docs/migrate)
- [Testing Guide](https://entgo.io/docs/testing)

---

**You now have a modern, type-safe database layer! 🎉**
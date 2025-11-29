# Ent ORM

Type-safe ORM for Go with code generation.

## What is Ent?

Ent is a simple yet powerful ORM for Go that:
- Generates type-safe code from schema
- Provides graph-based queries
- Handles migrations automatically
- Supports edges (relationships)
- Works with PostgreSQL, MySQL, SQLite

## Why We Use It

Previously considered manual SQL or GORM, but Ent is better:
- ✅ **Type Safety** - Compile-time errors, not runtime
- ✅ **Graph Queries** - Eager load relationships easily  
- ✅ **Code Generation** - No reflection, fast performance
- ✅ **Schema First** - Define once, generate everything
- ✅ **Testing Support** - Easy to test with enttest

## Installation

```bash
cd backend
go get entgo.io/ent/cmd/ent
```

## Schema Definition

### Location
```
backend/ent/schema/
├── game.go
├── player.go
├── role.go
└── gamerole.go
```

### Example Schema

```go
// ent/schema/game.go
package schema

import (
	"time"
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type Game struct {
	ent.Schema
}

func (Game) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			MaxLen(12).
			Unique().
			Immutable(),
		field.Enum("status").
			Values("pending", "active", "completed").
			Default("pending"),
		field.String("moderator_id").
			NotEmpty(),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

func (Game) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("players", Player.Type),
		edge.To("game_roles", GameRole.Type),
	}
}

func (Game) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("status"),
		index.Fields("created_at"),
	}
}
```

## Code Generation

```bash
# Generate all Ent code
go generate ./ent

# Or manually
go run -mod=mod entgo.io/ent/cmd/ent generate ./ent/schema
```

This creates:
- `ent/` - Generated clients
- `ent/game/` - Game predicates and constants
- `ent/player/` - Player predicates
- etc.

## Usage

### Create Client

```go
import (
	"github.com/mafia-night/backend/ent"
	_ "github.com/lib/pq"
)

client, err := ent.Open("postgres", "postgres://user:pass@localhost/db")
if err != nil {
	log.Fatal(err)
}
defer client.Close()

// Run migrations
if err := client.Schema.Create(ctx); err != nil {
	log.Fatal(err)
}
```

### Create Entity

```go
game, err := client.Game.
	Create().
	SetID("ABC123").
	SetStatus("pending").
	SetModeratorID("mod-123").
	Save(ctx)
```

### Query Entity

```go
// Get by ID
game, err := client.Game.Get(ctx, "ABC123")

// Query with conditions
games, err := client.Game.
	Query().
	Where(game.StatusEQ(game.StatusPending)).
	All(ctx)
```

### Update Entity

```go
updated, err := game.Update().
	SetStatus("active").
	Save(ctx)
```

### Delete Entity

```go
err := client.Game.DeleteOne(game).Exec(ctx)
```

### Query with Edges

```go
// Load game with players
gameWithPlayers, err := client.Game.
	Query().
	Where(game.IDEQ("ABC123")).
	WithPlayers().
	Only(ctx)

// Access loaded players
players := gameWithPlayers.Edges.Players
```

## Testing

### Test Setup

```go
import (
	"github.com/mafia-night/backend/ent"
	_ "github.com/lib/pq"
)

func SetupTestDB(t *testing.T) *ent.Client {
	dbURL := "postgres://user:pass@localhost/test_db"
	
	client, err := ent.Open("postgres", dbURL)
	if err != nil {
		t.Fatal(err)
	}
	
	// Create schema
	if err := client.Schema.Create(context.Background()); err != nil {
		t.Fatal(err)
	}
	
	// Cleanup after test
	t.Cleanup(func() {
		client.Close()
	})
	
	return client
}
```

### Writing Tests

```go
func TestGameRepository_Create(t *testing.T) {
	client := SetupTestDB(t)
	ctx := context.Background()
	
	game, err := client.Game.
		Create().
		SetID("TEST123").
		SetStatus("pending").
		SetModeratorID("mod-1").
		Save(ctx)
	
	require.NoError(t, err)
	assert.Equal(t, "TEST123", game.ID)
}
```

## Field Types

Common field types:

```go
field.String("name")          // VARCHAR
field.Int("age")              // INT
field.Bool("active")          // BOOLEAN
field.Time("created_at")      // TIMESTAMP
field.Enum("status").Values(...) // ENUM
field.Text("description")     // TEXT
field.JSON("metadata", map[string]interface{}{}) // JSON
```

## Field Modifiers

```go
field.String("name").
	NotEmpty().              // NOT NULL with validation
	MaxLen(255).            // VARCHAR(255)
	MinLen(3).              // Validation
	Unique().               // UNIQUE constraint
	Optional().             // Nullable
	Default("value").       // DEFAULT value
	Immutable().            // Cannot be updated
```

## Edges (Relationships)

### One-to-Many

```go
// Game has many Players
// In Game schema:
edge.To("players", Player.Type)

// In Player schema:
edge.From("game", Game.Type).
	Ref("players").
	Field("game_id").
	Required().
	Unique()
```

### Many-to-Many

Use a join table (GameRole):

```go
// Game <-> GameRole <-> Player <-> GameRole <-> Role
```

## Indexes

```go
func (Game) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("status"),
		index.Fields("game_id", "name").Unique(),
	}
}
```

## Predicates

Generated predicates for queries:

```go
import "github.com/mafia-night/backend/ent/game"

// Equals
game.IDEQ("ABC123")
game.StatusEQ(game.StatusPending)

// Not equals
game.StatusNEQ(game.StatusCompleted)

// In
game.StatusIn(game.StatusPending, game.StatusActive)

// Comparisons
game.CreatedAtGT(time.Now().Add(-24 * time.Hour))

// Like (for strings)
game.IDHasPrefix("ABC")

// And/Or
game.Or(
	game.StatusEQ(game.StatusPending),
	game.StatusEQ(game.StatusActive),
)
```

## Migrations

Ent handles migrations automatically:

```go
// Create all tables
client.Schema.Create(ctx)

// Or use migration files with Atlas
```

For production, use Atlas for versioned migrations.

## Best Practices

### 1. Use Transactions

```go
tx, err := client.Tx(ctx)
if err != nil {
	return err
}
defer tx.Rollback()

// Do work...

return tx.Commit()
```

### 2. Eager Loading

```go
// Load related data in one query
games, err := client.Game.
	Query().
	WithPlayers().
	WithGameRoles(func(q *ent.GameRoleQuery) {
		q.WithRole()
	}).
	All(ctx)
```

### 3. Batching

```go
// Batch create
bulk := make([]*ent.PlayerCreate, len(names))
for i, name := range names {
	bulk[i] = client.Player.Create().SetName(name).SetGameID(gameID)
}
players, err := client.Player.CreateBulk(bulk...).Save(ctx)
```

### 4. Testing

Always use a separate test database.

## Troubleshooting

### Regenerate Code

If schema changes:
```bash
go generate ./ent
```

### Schema Mismatch

Drop and recreate (development only):
```go
client.Schema.Create(ctx, migrate.WithDropColumn(true), migrate.WithDropIndex(true))
```

### Type Errors

Ent uses generated types. Use them:
```go
game.StatusPending  // Not "pending"
role.TeamMafia      // Not "mafia"
```

## Related Notes

- [[PostgreSQL]] - Database
- [[Backend Architecture]] - How we use Ent
- [[Phase 2 - Database Layer]] - Implementation
- [[Go Language]] - Backend language
- [[TDD Approach]] - Testing with Ent

## Further Reading

- Official Docs: https://entgo.io/docs/getting-started
- Schema Guide: https://entgo.io/docs/schema-def
- Edges Guide: https://entgo.io/docs/schema-edges
- Testing Guide: https://entgo.io/docs/testing

---

#ent #orm #database #codegen #go

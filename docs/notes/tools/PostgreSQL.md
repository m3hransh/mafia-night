# PostgreSQL

Relational database for Mafia Night.

## Version

**PostgreSQL 16** (via [[Docker Compose]])

## Why PostgreSQL?

### ✅ Reliable
- ACID compliance
- Data integrity
- Battle-tested

### ✅ Feature-Rich
- JSON support (JSONB)
- Full-text search
- Array types
- Window functions

### ✅ Open Source
- Free
- Great community
- Excellent documentation

### ✅ Performance
- Efficient indexing
- Query optimization
- Connection pooling

## Configuration

### Docker Compose
```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: mafia_night
    POSTGRES_USER: mafia_user
    POSTGRES_PASSWORD: mafia_pass
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Connection String
```bash
DATABASE_URL=postgres://mafia_user:mafia_pass@localhost:5432/mafia_night?sslmode=disable
```

## Usage

### Start Database
```bash
just db
# or
docker-compose up postgres
```

### Connect
```bash
just db-connect
# or
psql postgres://mafia_user:mafia_pass@localhost:5432/mafia_night
```

### Common Commands
```sql
-- List tables
\dt

-- Describe table
\d games

-- List databases
\l

-- Quit
\q
```

## Schema (Planned)

See [[Phase 2 - Database Layer]] for full schema.

### Games Table
```sql
CREATE TABLE games (
    id VARCHAR(12) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    moderator_id VARCHAR(255) NOT NULL
);
```

### Players Table
```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    telegram_id VARCHAR(255),
    game_id VARCHAR(12) NOT NULL REFERENCES games(id),
    UNIQUE(game_id, name)
);
```

### Roles Table
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    team VARCHAR(20) NOT NULL,
    abilities TEXT
);
```

## Migrations

Using `golang-migrate`:

```bash
# Create migration
migrate create -ext sql -dir db/migrations -seq create_games

# Apply migrations
migrate -path db/migrations -database $DATABASE_URL up

# Rollback
migrate -path db/migrations -database $DATABASE_URL down 1

# Check version
migrate -path db/migrations -database $DATABASE_URL version
```

## Testing

### Test Database
```go
func setupTestDB(t *testing.T) *sql.DB {
    dbURL := os.Getenv("TEST_DATABASE_URL")
    if dbURL == "" {
        dbURL = "postgres://mafia_user:mafia_pass@localhost:5432/mafia_night_test"
    }
    
    db, err := sql.Open("postgres", dbURL)
    require.NoError(t, err)
    
    // Run migrations
    runMigrations(db)
    
    t.Cleanup(func() {
        cleanupDB(db)
        db.Close()
    })
    
    return db
}
```

### Clean Between Tests
```go
func cleanupDB(db *sql.DB) {
    db.Exec("TRUNCATE games, players, roles, game_roles CASCADE")
}
```

## Go Integration

### Connect
```go
import (
    "database/sql"
    _ "github.com/lib/pq"
)

db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
if err != nil {
    log.Fatal(err)
}
defer db.Close()
```

### Query
```go
var game Game
err := db.QueryRow(
    "SELECT id, status, created_at FROM games WHERE id = $1",
    gameID,
).Scan(&game.ID, &game.Status, &game.CreatedAt)
```

### Insert
```go
_, err := db.Exec(
    "INSERT INTO games (id, status, moderator_id) VALUES ($1, $2, $3)",
    game.ID, game.Status, game.ModeratorID,
)
```

### Transaction
```go
tx, err := db.Begin()
if err != nil {
    return err
}
defer tx.Rollback()

// Do work...

return tx.Commit()
```

## Performance

### Indexes
```sql
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_players_game_id ON players(game_id);
```

### Connection Pooling
```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

## Backup & Restore

### Backup
```bash
pg_dump postgres://mafia_user:mafia_pass@localhost:5432/mafia_night > backup.sql
```

### Restore
```bash
psql postgres://mafia_user:mafia_pass@localhost:5432/mafia_night < backup.sql
```

## Troubleshooting

### Connection Refused
```bash
# Check if running
docker-compose ps

# Start if not
just db
```

### Permission Denied
```bash
# Check user/password in connection string
# Check DATABASE_URL environment variable
```

### Database Doesn't Exist
```sql
-- Connect to default database
psql postgres://mafia_user:mafia_pass@localhost:5432/postgres

-- Create database
CREATE DATABASE mafia_night;
```

## Related Notes

- [[Docker Compose]] - How we run PostgreSQL
- [[Phase 2 - Database Layer]] - Schema design
- [[Backend Architecture]] - How we use database
- [[Tech Stack]] - All technologies

---

#postgresql #database #storage #sql

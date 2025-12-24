# Backend Testing Guide

## Current Status ✅

All backend tests are now **reliable and passing** with proper database isolation.

## Database Testing Strategy

### Approach: Unique Test Data + Sequential Cleanup

We use a **hybrid approach** that provides reliability without complexity:

1. **Unique identifiers** - Each test generates unique usernames/emails/IDs
2. **Sequential cleanup** - Tests run with `-p 1` to avoid race conditions
3. **Automatic cleanup** - Database cleaned before and after each test

### Why This Approach?

| Approach | Pros | Cons | Our Choice |
|----------|------|------|------------|
| **Unique Data (Current)** | ✅ Simple<br>✅ Reliable<br>✅ Real DB testing | ⚠️ Sequential execution | ✓ **USING** |
| Transaction Rollback | ✅ Fast<br>✅ Parallel | ❌ Aborts on constraint errors<br>❌ Can't test transactions | ✗ Not suitable |
| Docker per test | ✅ Perfect isolation | ❌ Very slow<br>❌ Complex | ✗ Overkill |
| Mocking | ✅ Fast<br>✅ No DB needed | ❌ Doesn't test real DB | ✗ Not integration tests |

## Running Tests

```bash
# Run all backend tests
just test-backend

# Run with verbose output
just test-backend-verbose

# Run with coverage
just test-backend-coverage

# Run specific test
cd backend && go test -v -run TestAdminService_CreateAdmin ./internal/service

# Run with race detector
cd backend && go test -race ./...
```

## Test Database Setup

### Automatic Setup
The test database is automatically set up when tests run:

```
postgres://mafia_user:mafia_pass@localhost:5432/mafia_night_test?sslmode=disable
```

### Manual Setup (if needed)
```bash
# Start PostgreSQL
just db

# Create test database
docker compose exec postgres psql -U mafia_user -c "CREATE DATABASE mafia_night_test;"

# Drop and recreate test database
just db-drop-test
```

### Custom Database URL
Override with environment variable:
```bash
export TEST_DATABASE_URL="postgres://user:pass@host:port/dbname?sslmode=disable"
just test-backend
```

## Writing Tests

### Best Practices ✅

#### 1. Use Unique Identifiers
```go
func TestSomething(t *testing.T) {
    client := database.SetupTestDB(t)
    
    // Generate unique data
    username := "user" + uniqueID()
    email := "test" + uniqueID() + "@example.com"
    
    // Run test...
}

// Helper function (already available in service tests)
func uniqueID() string {
    return fmt.Sprintf("%d", time.Now().UnixNano())
}
```

#### 2. Use Subtests for Logical Grouping
```go
func TestUserService_Create(t *testing.T) {
    client := database.SetupTestDB(t)
    service := NewUserService(client)
    
    t.Run("creates user successfully", func(t *testing.T) {
        // Test implementation
    })
    
    t.Run("fails with invalid email", func(t *testing.T) {
        // Test implementation
    })
}
```

#### 3. Clean Test Structure
```go
func TestFeature(t *testing.T) {
    // Setup
    client := database.SetupTestDB(t)
    service := NewService(client)
    ctx := context.Background()
    
    // Exercise
    result, err := service.DoSomething(ctx, input)
    
    // Verify
    require.NoError(t, err)
    assert.Equal(t, expected, result)
}
```

### Common Pitfalls ❌

```go
// ❌ DON'T: Hardcoded values that conflict across tests
username := "testuser"  // Will conflict with other tests!

// ✅ DO: Generate unique values
username := "testuser" + uniqueID()

// ❌ DON'T: Share state between subtests
var sharedUser *User
t.Run("test1", func(t *testing.T) {
    sharedUser = createUser()  // Bad!
})
t.Run("test2", func(t *testing.T) {
    useSharedUser(sharedUser)  // Bad!
})

// ✅ DO: Each test creates its own data
t.Run("test1", func(t *testing.T) {
    user := createUser()  // Good!
    // Use user...
})
t.Run("test2", func(t *testing.T) {
    user := createUser()  // Good!
    // Use user...
})

// ❌ DON'T: Use time.Sleep() for timing
time.Sleep(100 * time.Millisecond)

// ✅ DO: Use channels or proper synchronization
done := make(chan bool)
go func() {
    // async work
    done <- true
}()
<-done
```

## Test Structure

```
backend/
├── internal/
│   ├── database/
│   │   ├── testutil.go              # Test database setup utilities
│   │   ├── game_integration_test.go # Database integration tests
│   │   ├── player_integration_test.go
│   │   └── role_integration_test.go
│   ├── service/
│   │   ├── admin_service_test.go    # Service layer tests
│   │   ├── game_service_test.go
│   │   └── role_service_test.go
│   └── handler/
│       └── game_handler_test.go     # HTTP handler tests
└── pkg/
    └── gameid/
        └── gameid_test.go           # Package tests
```

## Test Types

### 1. Integration Tests (database/)
Test database interactions with real PostgreSQL:
```go
func TestGameRepository_Create(t *testing.T) {
    client := SetupTestDB(t)
    // Test actual database operations
}
```

### 2. Service Tests (service/)
Test business logic with database:
```go
func TestAdminService_CreateAdmin(t *testing.T) {
    client := database.SetupTestDB(t)
    service := NewAdminService(client)
    // Test service methods
}
```

### 3. Handler Tests (handler/)
Test HTTP handlers with mocked requests:
```go
func TestGameHandler_Create(t *testing.T) {
    client := database.SetupTestDB(t)
    handler := NewGameHandler(client)
    // Test HTTP endpoints
}
```

### 4. Unit Tests (pkg/)
Test pure functions without database:
```go
func TestGameID_Generate(t *testing.T) {
    id := gameid.Generate()
    assert.Len(t, id, 6)
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: mafia_user
          POSTGRES_PASSWORD: mafia_pass
          POSTGRES_DB: mafia_night_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.25'
      
      - name: Run tests
        run: just test-backend
        env:
          TEST_DATABASE_URL: postgres://mafia_user:mafia_pass@localhost:5432/mafia_night_test?sslmode=disable
```

## Debugging Failed Tests

### View detailed output
```bash
cd backend && go test -v ./internal/service -run TestAdminService_CreateAdmin
```

### Check database state
```bash
# Connect to test database
docker compose exec postgres psql -U mafia_user -d mafia_night_test

# List all admins
SELECT id, username, email FROM admins;

# Clean test database
just db-drop-test
```

### Common Issues

#### Issue: "username already exists"
**Cause**: Tests not using unique identifiers
**Fix**: Use `uniqueID()` helper function

#### Issue: "pq: current transaction is aborted"
**Cause**: Previous error in transaction
**Fix**: Each test should get fresh database client

#### Issue: Flaky tests
**Cause**: Race conditions from parallel execution
**Fix**: Tests run with `-p 1` flag (sequential)

## Future Improvements

### Option 1: Parallel Execution with Better Isolation
Use database-per-test or schema-per-test:
```bash
# Each test gets own schema
CREATE SCHEMA test_12345;
SET search_path TO test_12345;
```

### Option 2: Testcontainers
Spin up PostgreSQL container per test:
```go
postgres, err := testcontainers.GenericContainer(ctx, ...)
```

### Option 3: In-Memory SQLite
For fast unit tests (not for Postgres-specific features):
```go
client, err := ent.Open("sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")
```

## Metrics

Current test performance:
- **All tests**: ~2 seconds
- **Service tests**: ~1.6 seconds  
- **Database tests**: ~0.3 seconds
- **Handler tests**: ~0.15 seconds

Test coverage: Run `just test-backend-coverage` to see current coverage.

## Related Documentation

- [[CURRENT_FEATURES]] - Current feature implementation status
- [[API_INTEGRATION]] - Frontend-backend integration
- [[GITHUB_ACTIONS_SETUP]] - CI/CD pipeline setup

## External Resources

- [Go Testing Best Practices](https://go.dev/doc/tutorial/add-a-test)
- [Testify Documentation](https://github.com/stretchr/testify)
- [Ent Testing Guide](https://entgo.io/docs/testing/)

---

#testing #backend #go #database #ci-cd

# TDD Approach

Test-Driven Development (TDD) is the core methodology for this project.

## The Red-Green-Refactor Cycle

```
🔴 RED → 🟢 GREEN → ♻️ REFACTOR → 🔴 RED ...
```

### 1. 🔴 Red - Write Failing Test
```go
func TestHealthHandler(t *testing.T) {
    // This test will FAIL initially
    req := httptest.NewRequest("GET", "/health", nil)
    w := httptest.NewRecorder()
    
    healthHandler(w, req) // Function doesn't exist yet!
    
    assert.Equal(t, 200, w.Code)
}
```

**Why?** Ensures the test actually tests something.

### 2. 🟢 Green - Write Minimal Code
```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}
```

**Why?** Get to passing state quickly.

### 3. ♻️ Refactor - Improve Code
```go
func healthHandler(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
        "version": "1.0.0",
    })
}
```

**Why?** Make it better while tests ensure it still works.

## Benefits

### 1. **Design First**
Writing tests forces you to think about API design before implementation.

### 2. **Living Documentation**
Tests show how code should be used.

### 3. **Confidence**
Tests catch regressions immediately.

### 4. **Refactoring Safety**
Change code fearlessly - tests will catch breaks.

## TDD in This Project

### Backend (Go)
```bash
# 1. Write test in *_test.go
vim backend/internal/service/game_service_test.go

# 2. Run test (should fail)
just test-backend

# 3. Write implementation
vim backend/internal/service/game_service.go

# 4. Run test (should pass)
just test-backend

# 5. Refactor if needed
```

### Frontend (Jest)
```bash
# 1. Write test in __tests__/
vim frontend/__tests__/components/GameForm.test.tsx

# 2. Run test (should fail)
just test-frontend

# 3. Write component
vim frontend/components/GameForm.tsx

# 4. Run test (should pass)
just test-frontend

# 5. Refactor if needed
```

## Testing Workflow

See [[Testing Workflow]] for detailed commands.

## Examples in Project

- ✅ `backend/cmd/api/main_test.go` - Health check handler
- ✅ `frontend/__tests__/page.test.tsx` - Home page rendering

## Related Notes

- [[Testing Workflow]] - How to run tests
- [[Running Tests]] - Test commands
- [[Phase 1 - Infrastructure]] - TDD setup
- [[Development Workflow]] - Daily workflow

---

#tdd #testing #methodology #workflow

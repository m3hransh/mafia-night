# Just

Modern command runner - like `make` but better.

## What is Just?

Just is a task runner that saves commands you use frequently.

## Why We Use It

Instead of remembering:
```bash
cd backend && go test -v ./... -coverprofile=coverage.out
```

Just type:
```bash
just test-backend-coverage
```

## Configuration

### `Justfile`
Located at project root:
```just
# Run all tests
test:
    just test-backend
    just test-frontend

# Test backend with coverage
test-backend-coverage:
    cd backend && go test -v ./... -coverprofile=coverage.out
```

## Common Commands

### Testing
```bash
just test                    # All tests
just test-backend           # Go tests
just test-frontend          # Jest tests
just test-backend-coverage  # Go with coverage
```

### Development
```bash
just dev                # Start all services
just run-backend        # Start Go API
just dev-frontend       # Start Next.js dev server
```

### Building
```bash
just build-backend      # Build Go binary
just build-frontend     # Build Next.js
just nix-build          # Build with Nix
```

### Docker
```bash
just up                 # Start containers
just down               # Stop containers
just logs               # View logs
just db                 # PostgreSQL only
just db-connect         # Connect to DB
```

### Code Quality
```bash
just fmt                # Format all code
just lint               # Lint all code
just clean              # Clean artifacts
```

## See All Commands

```bash
just
# or
just --list
```

## Benefits

### ✅ Simple Syntax
Easier than Makefiles

### ✅ Cross-platform
Works on Linux, macOS, Windows

### ✅ Fast
Lightweight, instant execution

### ✅ Documented
Comments become help text

## Examples from Project

### Sequential Execution
```just
test:
    just test-backend
    just test-frontend
```
Runs backend tests, then frontend tests.

### Directory Context
```just
test-backend:
    cd backend && go test ./...
```
Changes to backend directory first.

### Default Recipe
```just
default:
    @just --list
```
Running `just` alone shows all commands.

## Justfile Tips

### List Commands
```bash
just --list
just -l
```

### Run Specific Recipe
```bash
just recipe-name
```

### Show Recipe
```bash
just --show recipe-name
```

### Quiet Output
```just
@silent-command:
    @echo "This won't show the command itself"
```

## Related Notes

- [[Development Workflow]] - Using Just daily
- [[Testing Workflow]] - Test commands
- [[Docker Workflow]] - Docker commands
- [[Build Workflow]] - Building commands
- [[Nix Flakes]] - Just is provided by Nix

## Further Reading

- Justfile: `Justfile` in project root
- Official docs: https://just.systems/

---

#just #tools #automation #taskrunner

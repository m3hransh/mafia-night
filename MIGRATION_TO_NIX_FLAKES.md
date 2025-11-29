# Migration: Bazel → Nix Flakes 🎉

## Summary

Successfully removed Bazel and migrated to Nix Flakes for a cleaner, more NixOS-native development experience.

---

## What Was Removed ❌

### Bazel Files
- `.bazelversion`
- `.bazelrc`
- `.bazelrc.local`
- `BUILD.bazel` (root)
- `MODULE.bazel`
- `MODULE.bazel.lock`
- `WORKSPACE`
- `backend/BUILD.bazel`
- `scripts/bazel-nix.sh`

### Old Nix
- `shell.nix` (replaced with `flake.nix`)

**Total removed:** ~1000 lines of configuration!

---

## What Was Added ✅

### Nix Flakes
- `flake.nix` (single configuration file)
- `flake.lock` (locked dependencies)

### Task Runner
- `Justfile` (replaces complex build commands)

### Updates
- `.envrc` → changed from `use nix` to `use flake`
- `.gitignore` → updated for Nix

**Total added:** ~300 lines of clean configuration!

---

## Why This Is Better

### 1. **Simpler** 🎯
```bash
# Before (Bazel)
bazel test //backend/cmd/api:api_test

# After (Nix + Just)
just test-backend
```

### 2. **No NixOS Issues** ✅
```bash
# Before: Needed /bin/bash symlink, gcc workarounds
# After: Just works! Native NixOS support
```

### 3. **Automatic Environment** 🚀
```bash
# Before: Manually run nix-shell or fight with Bazel
# After: direnv loads everything automatically on cd
```

### 4. **Cleaner Workflow** 📝
```bash
# See all commands
just

# Run tests
just test

# Start dev environment
just dev
```

### 5. **Better Caching** ⚡
```bash
# Nix caches based on content hash
# Same inputs = instant rebuild
```

---

## Migration Checklist

- [x] Removed all Bazel files
- [x] Created `flake.nix` with dev shell
- [x] Added `Justfile` for commands
- [x] Configured `direnv` with `use flake`
- [x] Updated `.gitignore`
- [x] Updated `README.md`
- [x] Created `docs/NIX_FLAKES_GUIDE.md`
- [x] Tested backend builds with Nix
- [x] Tested development shell
- [x] Tested direnv auto-loading
- [x] Verified all tests pass

---

## How to Use

### Option 1: direnv (Automatic) ⭐ **RECOMMENDED**

```bash
# One-time setup
direnv allow

# Just cd into directory
cd mafia-night
# ✨ Environment loads automatically!

# Run commands
just test
go version  # go1.25.4
node --version  # v22.21.1
```

### Option 2: nix develop (Manual)

```bash
# Enter development shell
nix develop

# You're in!
🎭 Mafia Night Development Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Go:       go1.25.4
Node:     v22.21.1
Postgres: 16.11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Option 3: Just Commands

```bash
# See what's available
just

# Common tasks
just test           # Run all tests
just dev            # Start development
just build-backend  # Build Go binary
just up             # Start Docker services
```

---

## Testing Results

### ✅ All Tests Pass

```bash
# Backend
just test-backend
✅ ok github.com/mafia-night/backend/cmd/api (cached)

# Frontend  
just test-frontend
✅ Test Suites: 1 passed, 1 total
✅ Tests:       2 passed, 2 total

# Dev shell
nix develop
✅ Go:   go1.25.4
✅ Node: v22.21.1
✅ All tools available
```

---

## What You Get

### Development Shell Includes:

**Languages:**
- Go 1.25.4
- Node.js 22.21.1

**Tools:**
- gopls (Go language server)
- gotools (goimports, etc.)
- go-tools (staticcheck)
- TypeScript
- typescript-language-server

**Database:**
- PostgreSQL 16.11

**Build Tools:**
- gcc
- gnumake
- just

**Dev Tools:**
- git
- gh (GitHub CLI)
- gofumpt (Go formatter)
- golangci-lint
- nixpkgs-fmt

---

## Nix Flake Features

### Build Backend
```bash
nix build
# Creates ./result -> /nix/store/xxx-mafia-night-backend

./result/bin/api
```

### Run Backend
```bash
nix run
# Starts the API server directly
```

### Update Dependencies
```bash
nix flake update
# Updates nixpkgs and other inputs
```

### Check Flake
```bash
nix flake check
# Validates flake configuration
```

---

## Justfile Commands

```bash
# Testing
just test                # All tests
just test-backend        # Go tests
just test-frontend       # Jest tests
just test-backend-verbose  # Verbose output
just test-backend-coverage  # With coverage

# Development
just run-backend         # Start Go server
just dev-frontend        # Start Next.js dev
just dev                 # Start all services

# Building
just build-backend       # Build Go binary
just build-frontend      # Build Next.js
just nix-build           # Build with Nix

# Code Quality
just fmt                 # Format code
just fmt-backend         # Format Go
just lint                # Lint all
just lint-backend        # Lint Go
just lint-frontend       # Lint Next.js

# Docker
just up                  # Start all services
just up-detached         # Background mode
just down                # Stop services
just logs                # View logs
just db                  # PostgreSQL only
just db-connect          # Connect to DB

# Maintenance
just clean               # Clean build artifacts
just clean-deps          # Clean node_modules
just clean-all           # Clean everything
```

---

## Benefits Summary

| Aspect | Bazel | Nix Flakes |
|--------|-------|------------|
| **Lines of config** | ~1000 | ~300 |
| **NixOS issues** | Many | None |
| **Learning curve** | Steep | Gentle |
| **Auto-load** | No | Yes (direnv) |
| **Multi-language** | Complex | Simple |
| **Caching** | Good | Excellent |
| **Native Go** | Via rules_go | Yes |
| **Native Node** | Via rules_js | Yes |

---

## Documentation

- **[docs/NIX_FLAKES_GUIDE.md](docs/NIX_FLAKES_GUIDE.md)** - Complete guide
- **[README.md](README.md)** - Updated with Nix instructions
- **[Justfile](Justfile)** - All available commands

---

## Git Commits

```
810e624 - 🔥 Remove Bazel, add Nix Flakes + direnv
95985f1 - Add flake.lock
```

---

## Next Steps

1. ✅ Bazel removed
2. ✅ Nix Flakes working
3. ✅ direnv configured
4. ✅ Just commands available
5. ✅ Tests passing
6. ⏭️  Ready for Phase 2!

---

**Status:** Migration Complete! 🎉

**To continue:** Say "continue with Phase 2" and let's build the database layer! 🚀

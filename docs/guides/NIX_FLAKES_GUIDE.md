# Nix Flakes Development Guide 🎯

## What is Nix Flakes?

Nix Flakes is the modern way to manage Nix projects with:
- **Reproducible**: Same inputs = same outputs, always
- **Pure**: No hidden dependencies
- **Fast**: Better caching than traditional Nix
- **Composable**: Easy to combine multiple flakes

## Why We Ditched Bazel

| Feature | Bazel | Nix Flakes |
|---------|-------|------------|
| Setup complexity | High | Low |
| NixOS compatibility | Poor (needs workarounds) | Perfect (native) |
| Learning curve | Steep | Gentle |
| Caching | Good | Excellent |
| Go integration | Needs rules_go | Native |
| Node.js integration | Complex | Simple |

**Result:** Nix Flakes is the natural choice for NixOS! ✨

---

## Project Structure

```
mafia-night/
├── flake.nix          # Main flake configuration
├── flake.lock         # Locked dependencies (like package-lock.json)
├── Justfile           # Command runner
├── .envrc             # direnv configuration
├── backend/           # Go API
└── frontend/          # Next.js app
```

---

## The flake.nix Explained

### Inputs (Dependencies)
```nix
inputs = {
  nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";  # Package repository
  flake-utils.url = "github:numtide/flake-utils";       # Helper functions
};
```

**What they do:**
- `nixpkgs`: All packages (Go, Node, PostgreSQL, etc.)
- `flake-utils`: Makes flake work on multiple systems (Linux, macOS)

### Outputs (What You Get)
```nix
outputs = { self, nixpkgs, flake-utils }: ...
```

**Three types of outputs:**

#### 1. **devShells.default** - Development Environment
```nix
devShells.default = pkgs.mkShell {
  buildInputs = [ go nodejs_22 postgresql_16 ... ];
  shellHook = ''
    # Runs when entering shell
    echo "Welcome!"
  '';
};
```

**Access with:**
```bash
nix develop      # Enter development shell
```

#### 2. **packages** - Buildable Artifacts
```nix
packages = {
  backend = pkgs.buildGoModule { ... };
  default = backend;
};
```

**Access with:**
```bash
nix build        # Builds the backend
nix build .#backend  # Explicitly build backend
```

#### 3. **apps** - Runnable Programs
```nix
apps.default = {
  type = "app";
  program = "${backend}/bin/api";
};
```

**Access with:**
```bash
nix run          # Runs the backend API
```

---

## Using Nix Flakes

### Development Workflow

#### Method 1: Manual (nix develop)
```bash
# Enter shell each time
nix develop

# You're now in the dev environment
go version    # go1.25.4
node --version  # v22.21.1

# Run tests
cd backend && go test ./...

# Exit shell
exit
```

#### Method 2: direnv (Automatic) ⭐ **RECOMMENDED**
```bash
# One-time setup
direnv allow

# Now just cd into the directory!
cd /path/to/mafia-night
# ✨ Environment loads automatically!

# Go and Node are available immediately
go version
node --version

# Leave directory
cd ..
# Environment unloads automatically
```

**How it works:**
- `.envrc` file contains: `use flake`
- direnv reads it and loads the flake
- Automatic on `cd`, unloads on exit

---

## The Justfile Explained

Justfile is like Makefile but better:
- Clearer syntax
- Better error messages
- Built-in help

### Common Commands

```bash
# See all available commands
just

# Or
just --list

# Test backend
just test-backend

# Test frontend
just test-frontend

# Test everything
just test

# Start development environment
just dev

# Build backend
just build-backend

# Format code
just fmt

# Lint code
just lint
```

### Justfile Benefits

**Before (manual commands):**
```bash
cd backend && go test ./... && cd ..
cd frontend && npm test && cd ..
```

**After (Justfile):**
```bash
just test
```

---

## direnv Integration

### Setup direnv (One-Time)

1. **Install direnv** (already done on your system):
   ```bash
   which direnv  # /home/mehran/.nix-profile/bin/direnv
   ```

2. **Add to your shell** (add to ~/.bashrc or ~/.zshrc):
   ```bash
   # For Bash
   eval "$(direnv hook bash)"
   
   # For Zsh
   eval "$(direnv hook zsh)"
   
   # For Fish
   direnv hook fish | source
   ```

3. **Reload shell:**
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

### Using direnv

```bash
# Navigate to project
cd /path/to/mafia-night

# First time: allow direnv
direnv allow

# Environment loads automatically!
# You'll see:
direnv: loading ~/Projects/mafia-night/.envrc
direnv: using flake
direnv: nix-direnv: using cached dev shell

# Check environment
go version    # Works!
node --version  # Works!
just --version  # Works!

# When you leave:
cd ~
direnv: unloading

# Tools not available anymore (isolated!)
```

### direnv Features

- ✅ **Automatic**: Loads on cd, unloads on exit
- ✅ **Fast**: Caches environment (instant after first load)
- ✅ **Isolated**: Different projects = different environments
- ✅ **Smart**: Only reloads when files change

---

## Development Commands

### Quick Reference

```bash
# Development
just dev              # Start all services
just test             # Run all tests
just test-backend     # Test Go code
just test-frontend    # Test Next.js code

# Building
just build-backend    # Build Go binary
just build-frontend   # Build Next.js
nix build             # Build with Nix

# Running
just run-backend      # Run Go server
just dev-frontend     # Run Next.js dev server
nix run               # Run backend with Nix

# Database
just db               # Start PostgreSQL
just db-connect       # Connect to database
just db-stop          # Stop database

# Code quality
just fmt              # Format code
just lint             # Lint code
just clean            # Clean build artifacts

# Docker
just up               # Start all services
just down             # Stop all services
just logs             # View logs

# Nix
just nix-build        # nix build
just nix-run          # nix run
just nix-update       # Update flake inputs
```

---

## Building with Nix

### Backend Build

The flake defines a Go module build:

```nix
backend = pkgs.buildGoModule {
  pname = "mafia-night-backend";
  version = "0.1.0";
  src = ./backend;
  vendorHash = null;  # No vendor directory
};
```

**Build it:**
```bash
nix build

# Creates ./result symlink
ls -la result
# result -> /nix/store/xxx-mafia-night-backend-0.1.0

# Run it
./result/bin/api
```

**Why use Nix build?**
- Reproducible (same on all machines)
- Cached (rebuilds only what changed)
- Pure (no hidden dependencies)

---

## Updating Dependencies

### Update Nix Dependencies
```bash
# Update all flake inputs
nix flake update

# Or just nixpkgs
nix flake lock --update-input nixpkgs

# Commit the new flake.lock
git add flake.lock
git commit -m "Update flake dependencies"
```

### Update Go Dependencies
```bash
cd backend
go get -u ./...
go mod tidy

# Rebuild with Nix
nix build
```

### Update Node Dependencies
```bash
cd frontend
npm update
npm audit fix

# Test
just test-frontend
```

---

## Advantages Over Bazel

### 1. **Native NixOS Integration**
```bash
# Bazel: Needed /bin/bash symlink, gcc workarounds
# Nix:   Just works! ✨
```

### 2. **Simpler Configuration**
```bash
# Bazel: BUILD.bazel, MODULE.bazel, WORKSPACE, .bazelrc
# Nix:   Just flake.nix!
```

### 3. **Better Caching**
```nix
# Nix caches based on input hash
# Same inputs = instant build from cache
```

### 4. **Clearer Dependency Management**
```nix
buildInputs = [
  go          # Clear what you need
  nodejs_22
  postgresql_16
];
```

### 5. **Multi-language Support**
```nix
# Go, Node.js, Python, Rust - all first-class
# No need for language-specific rule sets
```

---

## Common Workflows

### Starting Development
```bash
# Option 1: With direnv (automatic)
cd mafia-night
# Environment loads automatically!
just test

# Option 2: Manual
cd mafia-night
nix develop
just test
```

### Testing Changes
```bash
# Backend
just test-backend

# Frontend
just test-frontend

# Both
just test
```

### Building for Production
```bash
# Build backend with Nix
nix build

# Build frontend
just build-frontend

# Or use Docker
just up
```

### Adding New Dependencies

#### Backend (Go)
```bash
cd backend
go get github.com/some/package
go mod tidy
```

#### Frontend (Node)
```bash
cd frontend
npm install some-package
```

#### System Tools
Edit `flake.nix`:
```nix
buildInputs = with pkgs; [
  go
  nodejs_22
  # Add new tool here:
  jq          # JSON processor
  httpie      # HTTP client
];
```

Then:
```bash
direnv reload  # With direnv
# or
nix develop    # Manual
```

---

## Troubleshooting

### Issue: "flake.nix not tracked by git"
```bash
# Solution: Git add it
git add flake.nix
```

### Issue: direnv not loading
```bash
# Check .envrc exists
cat .envrc  # Should contain: use flake

# Allow direnv
direnv allow

# Check hook is installed
echo $DIRENV_DIR  # Should output something
```

### Issue: "evaluation error"
```bash
# Clean and rebuild
nix flake check
nix develop --refresh
```

### Issue: Slow first load
```bash
# Normal! Nix downloads and builds
# Subsequent loads are instant (cached)

# Check what's being built
nix develop --show-trace
```

---

## Tips & Tricks

### 1. Faster Builds
```bash
# Use binary caches
nix.settings.substituters = [
  "https://cache.nixos.org"
];
```

### 2. Garbage Collection
```bash
# Clean old generations
nix-collect-garbage -d

# Keep last 7 days
nix-collect-garbage --delete-older-than 7d
```

### 3. Check What's in Your Environment
```bash
nix develop --command which go
nix develop --command env | grep -i path
```

### 4. Offline Development
```bash
# Download everything first
nix develop --offline

# Now works without internet!
```

---

## Comparison: Before vs After

### Before (Bazel)
```bash
# Setup
- Create /bin/bash symlink
- Configure .bazelrc for NixOS
- Fight with gcc detection
- Learn Starlark syntax
- Write BUILD files everywhere

# Daily use
bazel test //...  # Slow first time
bazel build //... # Complex syntax
```

### After (Nix Flakes)
```bash
# Setup  
direnv allow  # That's it!

# Daily use
just test     # Simple and fast!
nix build     # Pure and reproducible!
```

---

## Resources

- [Nix Flakes Book](https://nixos.wiki/wiki/Flakes)
- [Zero to Nix](https://zero-to-nix.com/)
- [Just Manual](https://just.systems/man/en/)
- [direnv Documentation](https://direnv.net/)

---

**Status:** ✅ Bazel removed, Nix Flakes working perfectly!

**Next:** Say "continue with Phase 2" to start building features! 🚀

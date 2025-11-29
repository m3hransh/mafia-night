# shell.nix Explained 🐚

## What is `shell.nix`?

A Nix file that defines a reproducible development environment. When you run `nix-shell`, it:
1. Downloads all specified packages
2. Sets up environment variables
3. Gives you a shell with everything configured

## Key Changes Made

### ✅ **Before (Wrong):**
```nix
go_1_23  # Old, version-specific attribute
```

### ✅ **After (Correct):**
```nix
go  # Always uses latest stable Go
```

**Why?**
- `go` = Latest stable (currently Go 1.25.4)
- `go_1_23` = Old, fixed version attribute
- NixOS updates `go` to track latest releases

## What's Included in Our Environment

### **Core Languages:**
```nix
go              # Go 1.25.4 (latest)
nodejs_22       # Node.js 22.21.1
```

### **Build Tools:**
```nix
bazel_8         # Bazel 8.4.2
gcc             # C compiler (for CGO)
gnumake         # Make utility
```

### **Database:**
```nix
postgresql_16   # PostgreSQL 16.11
```

### **Dev Tools:**
```nix
git             # Version control
gopls           # Go Language Server (for VSCode/IDEs)
gotools         # goimports, godoc, etc.
```

### **Containers:**
```nix
docker
docker-compose
```

## Using the Nix Shell

### **Method 1: Manual**
```bash
nix-shell

# You'll see:
# 🎭 Mafia Night Development Environment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Go:       go1.25.4
# Node:     v22.21.1
# Bazel:    bazel 8.4.2
# Postgres: 16.11
```

### **Method 2: One-off Command**
```bash
nix-shell --run "go test ./..."
nix-shell --run "npm test"
```

### **Method 3: direnv (Auto-load)**
```bash
# Install direnv
nix-env -iA nixpkgs.direnv

# Enable in your shell (add to ~/.bashrc or ~/.zshrc)
eval "$(direnv hook bash)"  # or zsh

# Allow in this directory
cd /path/to/mafia-night
direnv allow

# Now cd into the directory automatically loads the environment!
cd mafia-night  # ✨ Environment loaded automatically
```

## Environment Variables Set

```bash
GOPATH="$HOME/go"           # Go workspace
PATH includes:
  - $HOME/.local/bin        # User binaries (bazel)
  - $GOPATH/bin             # Go binaries
  - All Nix package bins    # go, node, bazel, etc.
```

## shellHook Explained

```nix
shellHook = ''
  # Runs every time you enter nix-shell
  
  # Check if /bin/bash exists
  if [ ! -e /bin/bash ]; then
    echo "⚠️  NOTE: /bin/bash doesn't exist"
    # ... suggestion to create it
  fi
  
  # Show welcome message
  echo "🎭 Mafia Night Development Environment"
  # ... version info
''
```

## Advantages of Nix Shell

### **1. Reproducibility**
```bash
# On your machine:
nix-shell  # Go 1.25.4, Node 22.21.1

# On teammate's machine:
nix-shell  # Same versions! ✅
```

### **2. Isolation**
```bash
# System Go version: 1.20
go version  # go1.20

# Inside nix-shell:
nix-shell
go version  # go1.25.4 (doesn't affect system)
```

### **3. No Global Installs**
```bash
# No need for:
sudo apt install golang
sudo snap install node
npm install -g bazel

# Just:
nix-shell  # Everything ready!
```

### **4. Declarative**
```nix
# Document exactly what you need
buildInputs = [
  go
  nodejs_22
  postgresql_16
]
# Everything in one file, version-controlled
```

## Common Commands Inside Nix Shell

```bash
# Enter the environment
nix-shell

# Check what's available
which go      # /nix/store/.../bin/go
which node    # /nix/store/.../bin/node
which bazel   # /nix/store/.../bin/bazel

# Run tests
cd backend && go test ./...
cd frontend && npm test

# Build
bazel build //backend/cmd/api:api
npm run build

# Exit
exit  # or Ctrl+D
```

## Updating the Environment

To add new tools, edit `shell.nix`:

```nix
buildInputs = with pkgs; [
  go
  nodejs_22
  # Add new tools here:
  python3          # Python
  jq               # JSON processor
  postgresql_16    # Database
];
```

Then:
```bash
nix-shell  # Downloads new packages
```

## Comparing to Other Solutions

| Tool | Purpose | Scope |
|------|---------|-------|
| `nix-shell` | Full dev environment | All languages/tools |
| `go.mod` | Go dependencies | Go only |
| `package.json` | Node dependencies | Node only |
| `Dockerfile` | Container image | Heavy, for deployment |
| `venv` (Python) | Virtual environment | Python only |

**Nix Shell = All of the above in one!**

## Why Not Just Install Globally?

### **Global Install Problems:**
```bash
# Your project needs Go 1.25
sudo apt install golang  # Installs Go 1.20 ❌

# Or use snap
snap install go --classic  # Gets Go 1.21 ❌

# Meanwhile, another project needs Go 1.23
# Now you have conflicts! 🔥
```

### **Nix Shell Solution:**
```bash
# Project A (uses Go 1.23)
cd project-a && nix-shell
go version  # go1.23 ✅

# Project B (uses Go 1.25)
cd project-b && nix-shell
go version  # go1.25 ✅

# No conflicts, no pain! 🎉
```

## Integration with IDEs

### **VSCode:**
1. Install "Nix Environment Selector" extension
2. Run `nix-shell` in terminal
3. LSP (Language Server Protocol) works with gopls

### **GoLand/IntelliJ:**
Settings → Go → GOROOT → Point to `/nix/store/.../go`

### **Vim/Neovim:**
Use with CoC or vim-lsp, gopls automatically found

## Troubleshooting

### **Issue: "nix-shell: command not found"**
```bash
# Install Nix
sh <(curl -L https://nixos.org/nix/install) --daemon
```

### **Issue: Slow First Run**
```bash
# Normal! Nix downloads and caches everything
# Subsequent runs are instant ⚡
```

### **Issue: Disk Space**
```bash
# Clean old generations
nix-collect-garbage -d
```

## Best Practices

1. **Always use nix-shell for development**
   ```bash
   nix-shell
   # Now run your commands
   ```

2. **Use direnv for auto-loading**
   ```bash
   echo "use nix" > .envrc
   direnv allow
   ```

3. **Keep shell.nix in git**
   ```bash
   git add shell.nix
   # Team gets same environment
   ```

4. **Document custom setup in shellHook**
   ```nix
   shellHook = ''
     echo "Run 'make setup' to initialize database"
   '';
   ```

## Nix Shell vs Docker

| Feature | nix-shell | Docker |
|---------|-----------|--------|
| Speed | ⚡ Instant | 🐢 Slow (build) |
| Isolation | Process-level | Container |
| IDE Integration | ✅ Native | ❌ Complex |
| File System | Native | Volume mounts |
| Use Case | Development | Production |

**Best of Both:**
Use `nix-shell` for development, Docker for deployment!

## Current Output

When you run `nix-shell`:

```
🎭 Mafia Night Development Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Go:       go1.25.4
Node:     v22.21.1
Bazel:    bazel 8.4.2
Postgres: 16.11
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick commands:
  cd backend && go test ./...      # Test backend
  cd frontend && npm test          # Test frontend
  docker-compose up                # Start all services
```

---

**📚 More Resources:**
- [Nix Pills](https://nixos.org/guides/nix-pills/) - Learn Nix fundamentals
- [nix.dev](https://nix.dev/) - Tutorials and guides
- [Nixpkgs Search](https://search.nixos.org/) - Find packages

**🎯 Quick Start:**
```bash
nix-shell
cd backend && go test ./...
```

That's it! You're in a fully configured development environment! 🚀

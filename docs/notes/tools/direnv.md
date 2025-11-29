# direnv

Automatic environment loading when you `cd` into the project.

## What is direnv?

direnv is a shell extension that automatically loads/unloads environment variables based on your current directory.

## Why We Use It

Without direnv:
```bash
cd mafia-night
nix develop  # Manual!
exit
cd ..
# Environment persists (not isolated)
```

With direnv:
```bash
cd mafia-night
# ✨ Environment loads automatically!
cd ..
# ✨ Environment unloads automatically!
```

## Setup

### 1. Install direnv
```bash
# NixOS (add to configuration.nix)
environment.systemPackages = [ pkgs.direnv ];

# Or with Nix
nix profile install nixpkgs#direnv
```

### 2. Add to Shell
```bash
# Bash (~/.bashrc)
eval "$(direnv hook bash)"

# Zsh (~/.zshrc)
eval "$(direnv hook zsh)"

# Fish (~/.config/fish/config.fish)
direnv hook fish | source
```

### 3. Allow Project
```bash
cd mafia-night
direnv allow
```

## Configuration

### `.envrc`
```bash
use flake
```

This tells direnv to use [[Nix Flakes]] for environment.

## How It Works

```
cd mafia-night/
  ↓
direnv reads .envrc
  ↓
Runs: nix develop
  ↓
Loads: Go, Node, PostgreSQL, etc.
  ↓
You can use: go, node, psql, just
  ↓
cd ../somewhere-else
  ↓
direnv unloads environment
  ↓
Back to normal shell
```

## Benefits

### ✅ Seamless
No need to remember to run `nix develop`

### ✅ Isolated
Environment only active in project directory

### ✅ Fast
Cached - instant activation after first load

### ✅ Automatic
Works in terminal, IDE, and scripts

## Commands

```bash
# Allow project (first time)
direnv allow

# Reload environment
direnv reload

# Check status
direnv status
```

## IDE Integration

### VS Code
Install "direnv" extension - automatically loads environment for terminal and language servers.

### IntelliJ/GoLand
Enable direnv support in settings.

### Vim/Neovim
Install `direnv.vim` plugin.

## Troubleshooting

### Not Loading
```bash
# Check if allowed
direnv status

# Allow it
direnv allow
```

### Slow Loading
```bash
# First load is slow (building environment)
# Subsequent loads are instant (cached)
```

### Variables Not Set
```bash
# Reload manually
direnv reload
```

## Related Notes

- [[Nix Flakes]] - What direnv loads
- [[Environment Setup]] - Setup guide
- [[Quick Start]] - Getting started
- [[Development Workflow]] - Daily usage

---

#direnv #tools #automation #environment

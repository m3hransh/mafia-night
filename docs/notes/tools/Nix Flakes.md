# Nix Flakes

Pure, reproducible development environments and builds.

## What is Nix Flakes?

Nix Flakes is a modern package manager feature that provides:
- **Reproducible** builds (same inputs = same outputs)
- **Declarative** configuration (describe what you want)
- **Hermetic** builds (isolated from system)
- **Cross-platform** (Linux, macOS, NixOS)

## Why We Use It

Previously used [[Bazel Migration|Bazel]], but Nix Flakes is better for our needs:
- ✅ Native NixOS support (no `/bin/bash` workarounds)
- ✅ Simpler configuration (~300 lines vs ~1000)
- ✅ Automatic environment loading with [[direnv]]
- ✅ Better caching (content-addressed)

## Configuration

### `flake.nix`
Single file defining everything:
```nix
{
  description = "Mafia Night - Game management app";
  
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  
  outputs = { self, nixpkgs }: {
    # Development shell
    devShells.x86_64-linux.default = ...;
    
    # Backend package
    packages.x86_64-linux.default = ...;
  };
}
```

### `flake.lock`
Locked versions of all dependencies (like `package-lock.json`).

## Usage

### Enter Development Shell
```bash
# Manual
nix develop

# Automatic (with direnv)
cd mafia-night  # Loads automatically!
```

### Build Backend
```bash
nix build
./result/bin/api
```

### Run Backend
```bash
nix run
```

### Update Dependencies
```bash
nix flake update
```

## What's Included

Development shell provides:
- [[Go Language]] 1.25.4
- Node.js 22.21.1
- [[PostgreSQL]] 16
- [[Just]] - Command runner
- gopls - Go language server
- TypeScript language server
- And more...

See [[Environment Setup]] for full list.

## Commands

See [[Just]] for task runner commands:
```bash
just test         # Run tests
just build-backend # Build Go
just dev          # Start development
```

## Troubleshooting

### Flake Not Found
```bash
# Enable flakes in Nix config
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### Permission Denied
```bash
# Allow direnv
direnv allow
```

### Stale Lock
```bash
# Update dependencies
nix flake update
```

## Related Notes

- [[Environment Setup]] - Setup guide
- [[direnv]] - Auto-loading
- [[Just]] - Task runner
- [[Quick Start]] - Getting started
- [[Bazel Migration]] - Why we switched
- [[Development Workflow]] - Daily usage

## Further Reading

- Full guide: `docs/guides/NIX_FLAKES_GUIDE.md`
- Official docs: https://nixos.wiki/wiki/Flakes

---

#nix #tools #devops #environment

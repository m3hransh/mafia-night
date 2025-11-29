# Quick Start

Get started with Mafia Night in 5 minutes.

## Prerequisites

- **Linux** or **macOS** (NixOS recommended but not required)
- **Git**

## Installation

### 1. Install Nix
```bash
curl --proto '=https' --tlsv1.2 -sSf -L \
  https://install.determinate.systems/nix | sh -s -- install
```

See [[Installing Nix]] for details.

### 2. Clone Repository
```bash
git clone <repository-url>
cd mafia-night
```

### 3. Enable Auto-Loading (Recommended)
```bash
direnv allow
```

Environment loads automatically! ✨

See [[direnv]] for more.

### 4. Test It Works
```bash
just test
```

Should see all tests passing.

## That's It! 🎉

You're ready to develop.

## Next Steps

### Run Development Environment
```bash
just dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Explore Commands
```bash
just
```

See all available commands.

### Read More
- [[Development Workflow]] - Daily development
- [[Testing Workflow]] - Running tests
- [[Tech Stack]] - Technologies used
- [[Project Structure]] - Code organization

## Without direnv (Manual)

If you don't want automatic loading:

```bash
# Enter development shell
nix develop

# Run commands
just test
go version
node --version

# Exit shell
exit
```

## Troubleshooting

### "experimental-features" Error
Enable Nix Flakes:
```bash
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### direnv Not Loading
```bash
direnv allow
direnv reload
```

### Port Already in Use
```bash
# Stop other services
docker-compose down

# Or use different ports (edit docker-compose.yml)
```

## What You Get

Running `nix develop` or `direnv allow` gives you:
- [[Go Language]] 1.25.4
- Node.js 22.21.1
- [[PostgreSQL]] 16
- [[Just]] command runner
- Language servers (gopls, typescript-language-server)
- Development tools (git, gh, etc.)

See [[Environment Setup]] for complete list.

## Related Notes

- [[Installing Nix]] - Detailed installation
- [[Environment Setup]] - What's included
- [[direnv]] - Auto-loading setup
- [[Development Workflow]] - Next steps
- [[Nix Flakes]] - How it works

---

#setup #quickstart #installation

# Documentation Index

Welcome to Mafia Night documentation! 📚

## 🚀 Quick Links

- **[Main README](../README.md)** - Project overview and quick start
- **[Project Phases](../PROJECT_PHASES.md)** - Development roadmap
- **[Phase 1 Summary](../PHASE1_SUMMARY.md)** - Infrastructure setup completion

---

## 📖 Guides

### Development Setup
- **[Nix Flakes Guide](guides/NIX_FLAKES_GUIDE.md)** - Complete guide to using Nix Flakes
  - What is Nix Flakes
  - Development workflow
  - direnv integration
  - Building and running
  - Troubleshooting

- **[Shell Environment Guide](guides/SHELL_NIX_EXPLAINED.md)** - Understanding the development shell
  - Nix shell explained
  - Why Go instead of go_1_23
  - IDE integration
  - Best practices

### NixOS Specific
- **[NixOS Quick Setup](setup/README_NIXOS.md)** - Quick reference for NixOS users

---

## 📦 Migration & History

- **[Bazel to Nix Flakes Migration](../MIGRATION_TO_NIX_FLAKES.md)** - How we migrated from Bazel
  - What was removed
  - What was added
  - Why it's better
  - Migration checklist

---

## 🗄️ Archive

Old documentation (kept for reference):
- [Bazel NixOS Complete Guide](archive/BAZEL_NIXOS_COMPLETE.md) - Obsolete: Bazel removed
- [NixOS Bazel Fix](archive/NIXOS_BAZEL_FIX.md) - Obsolete: Bazel removed

---

## 🎯 Common Tasks

### Getting Started
```bash
# 1. Install Nix
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# 2. Enter project directory
cd mafia-night

# 3. Enable direnv
direnv allow

# 4. Start developing!
just test
```

### Development Commands
```bash
just                    # Show all commands
just test              # Run all tests
just test-backend      # Test Go code
just test-frontend     # Test Next.js
just dev               # Start development
just build-backend     # Build Go binary
nix build              # Build with Nix
nix run                # Run backend
```

### Documentation Tasks
```bash
# Add new documentation
# 1. Create file in appropriate directory:
#    - docs/guides/     for tutorials and how-tos
#    - docs/setup/      for installation/setup guides
#    - docs/archive/    for obsolete docs (reference only)

# 2. Update this README.md with link

# 3. Commit
git add docs/
git commit -m "docs: Add XYZ guide"
```

---

## 📁 Directory Structure

```
docs/
├── README.md                    # This file - documentation index
├── guides/                      # Development guides
│   ├── NIX_FLAKES_GUIDE.md     # Complete Nix Flakes guide
│   └── SHELL_NIX_EXPLAINED.md  # Shell environment guide
├── setup/                       # Setup instructions
│   └── README_NIXOS.md         # NixOS quick setup
└── archive/                     # Obsolete documentation
    ├── BAZEL_NIXOS_COMPLETE.md # Old Bazel docs
    └── NIXOS_BAZEL_FIX.md      # Old Bazel fixes
```

---

## 🤝 Contributing to Documentation

When adding new documentation:

1. **Choose the right location:**
   - `guides/` - Tutorials, how-tos, in-depth explanations
   - `setup/` - Installation, configuration, getting started
   - `archive/` - Keep old docs for reference (mark as obsolete)

2. **Use clear formatting:**
   - Start with a clear title
   - Add a table of contents for long docs
   - Use code blocks with syntax highlighting
   - Add examples and screenshots where helpful

3. **Keep it updated:**
   - Review docs when features change
   - Archive obsolete documentation
   - Update links in this index

4. **Follow conventions:**
   - Use Markdown format
   - Name files with SCREAMING_SNAKE_CASE or kebab-case
   - Keep lines under 100 characters when possible

---

## 🆘 Need Help?

- Check the [Quick Start in main README](../README.md#quick-start)
- Read the [Nix Flakes Guide](guides/NIX_FLAKES_GUIDE.md)
- Review [Migration Guide](../MIGRATION_TO_NIX_FLAKES.md) for context
- Open an issue on GitHub

---

**Last Updated:** 2025-11-29  
**Current Phase:** Phase 1 Complete ✅

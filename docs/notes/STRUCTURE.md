# Atomic Notes Structure

Visual map of the knowledge base organization.

## Graph Overview

```
                    ┌─────────────────┐
                    │ Project Overview│
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
    ┌───────▼────────┐ ┌────▼─────┐  ┌──────▼──────┐
    │   Tech Stack   │ │   TDD    │  │  Structure  │
    └───────┬────────┘ │ Approach │  └──────┬──────┘
            │          └────┬─────┘          │
    ┌───────┴────────┐     │         ┌──────┴──────┐
    │     Tools      │     │         │Architecture │
    ├────────────────┤     │         ├─────────────┤
    │ • Nix Flakes   │     │         │ • Backend   │
    │ • direnv       │◄────┼────────►│ • Frontend  │
    │ • Just         │     │         └─────────────┘
    │ • Docker       │     │
    │ • PostgreSQL   │     │
    │ • Go           │     │
    │ • Next.js      │     │
    └────────────────┘     │
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼────────┐ ┌──▼─────────┐ ┌─▼────────┐
    │     Setup      │ │  Workflows │ │  Phases  │
    ├────────────────┤ ├────────────┤ ├──────────┤
    │ • Quick Start  │ │ • Dev      │ │ • Phase1 │
    │ • Installing   │ │ • Testing  │ │ • Phase2 │
    └────────────────┘ └────────────┘ └──────────┘
```

## Note Categories

### 🎯 Core Concepts (4 notes)
Entry points and fundamental ideas:
- [[Project Overview]] - Start here!
- [[Tech Stack]] - Technologies
- [[TDD Approach]] - Methodology
- [[Project Structure]] - Organization

### 🛠️ Tools (8 notes)
Individual tool documentation:
- [[Nix Flakes]] - Build system
- [[direnv]] - Auto-loading
- [[Just]] - Task runner
- [[Docker Compose]] - Containers
- [[PostgreSQL]] - Database
- [[Go Language]] - Backend
- [[Next.js]] - Frontend

### ⚙️ Setup (2 notes)
Getting started:
- [[Quick Start]] - 5-minute setup
- [[Installing Nix]] - Detailed install

### 🏗️ Architecture (2 notes)
System design:
- [[Backend Architecture]] - Go design
- [[Frontend Architecture]] - Next.js design

### 📈 Phases (2 notes)
Development timeline:
- [[Phase 1 - Infrastructure]] ✅ Complete
- [[Phase 2 - Database Layer]] ⏳ Planned

### 🔄 Workflows (2 notes)
Daily processes:
- [[Development Workflow]] - TDD cycle
- [[Testing Workflow]] - Running tests

### 📖 Historical (1 note)
Context and decisions:
- [[Bazel Migration]] - Why Nix > Bazel

## Total: 21 Atomic Notes

## Connection Density

**Highly Connected:**
- [[Project Overview]] - Links to 5+ notes
- [[Tech Stack]] - Links to all tools
- [[TDD Approach]] - Links to workflows
- [[Nix Flakes]] - Links to setup & tools

**Moderately Connected:**
- Tool notes - Link to related tools
- Workflow notes - Link to tools & concepts
- Phase notes - Link to architecture & concepts

**Focused:**
- Setup notes - Link to tools
- Migration note - Historical context

## How to Navigate

### New to Project?
```
Start → Quick Start → Project Overview → Tech Stack
```

### Want to Code?
```
Start → Development Workflow → TDD Approach → Testing Workflow
```

### Understanding Architecture?
```
Start → Backend Architecture → Frontend Architecture → Project Structure
```

### Specific Tool?
```
Start → Tech Stack → [Tool Name]
```

### Historical Context?
```
Start → Bazel Migration → Phase 1 - Infrastructure
```

## Obsidian Features

### Graph View
See visual connections between notes.

### Backlinks
See what notes reference current note.

### Quick Switcher
`Cmd/Ctrl + O` to jump to any note.

### Search
Find content across all notes.

### Tags
Filter notes by:
- `#setup` - Setup guides
- `#workflow` - Processes
- `#tools` - Tool docs
- `#architecture` - Design
- `#phase1` `#phase2` - Phases
- `#tdd` - Testing

## Maintenance

### Adding New Notes
1. Create in appropriate subdirectory
2. Use `[[Note Name]]` for links
3. Add tags at bottom
4. Update this structure doc

### Linking Guidelines
- Link to concepts, not details
- Link when expanding on a topic
- Link to related workflows
- Link to tools used

### Keep Atomic
Each note should:
- Cover ONE concept
- Be self-contained
- Link to related topics
- Be under 200 lines

## Stats

- **Total Notes**: 21
- **Categories**: 7
- **Average Links per Note**: ~5
- **Deepest Link Path**: 3 levels

---

*Generated: 2025-11-29*

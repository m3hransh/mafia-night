# Project Structure

Organization of the Mafia Night codebase.

## Root Directory

```
mafia-night/
├── backend/          # Go backend
├── frontend/         # Next.js frontend
├── docs/            # Documentation
├── scripts/         # Utility scripts
├── docker-compose.yml
├── flake.nix        # Nix configuration
├── Justfile         # Task definitions
└── README.md
```

## Backend Structure

```
backend/
├── cmd/
│   └── api/              # Main application entry
│       ├── main.go       # HTTP server
│       └── main_test.go  # Server tests
├── internal/             # Private packages
│   ├── models/           # Data models (future)
│   ├── repository/       # Data access (future)
│   ├── service/          # Business logic (future)
│   └── handler/          # HTTP handlers (future)
├── pkg/                  # Public libraries (future)
├── go.mod               # Go dependencies
└── go.sum               # Dependency checksums
```

### Backend Conventions

- `cmd/` - Executable applications
- `internal/` - Private code (not importable by other projects)
- `pkg/` - Public libraries (can be imported)
- `*_test.go` - Test files (same directory as code)

See [[Backend Architecture]] for details.

## Frontend Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # Reusable React components
├── __tests__/           # Test files
│   └── page.test.tsx
├── package.json         # npm dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.js   # Tailwind CSS config
└── jest.config.js       # Jest config
```

### Frontend Conventions

- `app/` - Pages and layouts (file-based routing)
- `components/` - Reusable UI components
- `__tests__/` - Test files
- `*.test.tsx` - Component tests

See [[Frontend Architecture]] for details.

## Documentation Structure

```
docs/
├── notes/                    # Atomic notes (Obsidian)
│   ├── concepts/            # Core concepts
│   ├── setup/               # Setup guides
│   ├── architecture/        # Design docs
│   ├── phases/              # Phase summaries
│   ├── tools/               # Tool guides
│   └── workflows/           # Process docs
├── guides/                  # Long-form guides
│   ├── NIX_FLAKES_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── ENT_ORM_GUIDE.md
└── archive/                 # Obsolete docs
```

## Why This Structure?

### Backend
- **Go Standard Layout** - Community convention
- **Clear separation** - cmd, internal, pkg
- **Testability** - Tests live next to code

### Frontend
- **Next.js Convention** - App Router pattern
- **Component isolation** - Easy to test
- **Type safety** - TypeScript throughout

### Documentation
- **Atomic notes** - Easy to navigate and link
- **Guides** - In-depth tutorials
- **Archive** - Historical context

## Related Notes

- [[Backend Architecture]] - Backend design
- [[Frontend Architecture]] - Frontend design
- [[Project Overview]] - High-level view
- [[Go Language]] - Backend language conventions
- [[Next.js]] - Frontend framework

---

#structure #organization #conventions

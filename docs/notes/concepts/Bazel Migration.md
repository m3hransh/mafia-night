# Bazel Migration

Why we migrated from Bazel to [[Nix Flakes]].

## The Problem

Initially used **Bazel** as build system:
- Polyglot (Go + TypeScript)
- Reproducible builds
- Hermetic sandboxing
- Used by Google

### Issues We Hit

#### 1. NixOS Compatibility
```bash
ERROR: /bin/bash: No such file or directory
```
- Bazel assumes `/bin/bash` exists
- NixOS doesn't have `/bin/bash`
- Workarounds were complex and fragile

#### 2. Complexity
- ~1000 lines of configuration
- Multiple files: `WORKSPACE`, `MODULE.bazel`, `BUILD.bazel` everywhere
- Steep learning curve
- Hard to debug

#### 3. Version Issues
```
ERROR: aspect_rules_js@2.2.1 not found in registry
```
- Bazel Central Registry doesn't have latest versions
- Had to use older packages
- Manual version hunting

#### 4. Build Friction
```bash
# What we wanted
just test

# What we had to do
bazel test //backend/cmd/api:api_test --config=nixos --sandbox_debug
```

## The Solution: Nix Flakes

Switched to [[Nix Flakes]] + [[Just]].

### Benefits

| Aspect | Bazel | Nix Flakes |
|--------|-------|------------|
| **Config lines** | ~1000 | ~300 |
| **NixOS issues** | Many | None |
| **Learning curve** | Steep | Gentle |
| **Auto-load** | No | Yes ([[direnv]]) |
| **Setup time** | ~2 hours | ~5 minutes |
| **Native Go** | Via rules_go | Direct |
| **Native Node** | Via rules_js | Direct |

### Simpler Configuration

Before (Bazel):
```python
# MODULE.bazel
bazel_dep(name = "rules_go", version = "0.48.0")
bazel_dep(name = "gazelle", version = "0.36.0")

# BUILD.bazel
go_binary(
    name = "api",
    srcs = ["main.go"],
    deps = ["//internal/..."],
)

# Plus more files...
```

After (Nix Flakes):
```nix
# flake.nix (single file!)
{
  description = "Mafia Night";
  
  outputs = { nixpkgs, ... }: {
    devShells.x86_64-linux.default = pkgs.mkShell {
      packages = [ pkgs.go pkgs.nodejs ];
    };
  };
}
```

### Simpler Commands

Before (Bazel):
```bash
bazel test //backend/cmd/api:api_test
bazel build //backend/cmd/api:api
bazel run //backend/cmd/api:api
```

After (Nix + Just):
```bash
just test-backend
just build-backend
just run-backend
```

### Automatic Environment

Before (Bazel):
```bash
cd mafia-night
# Manually activate environment
nix-shell
# Or fight with Bazel's hermetic environment
```

After ([[direnv]]):
```bash
cd mafia-night
# ✨ Environment loads automatically!
```

## Migration Process

### 1. ✅ Removed Bazel Files
```bash
rm -f .bazelversion .bazelrc MODULE.bazel WORKSPACE BUILD.bazel
rm -f backend/BUILD.bazel
```

### 2. ✅ Created Nix Flakes
```bash
touch flake.nix
nix flake init
# Configured dev shell
```

### 3. ✅ Added Task Runner
```bash
touch Justfile
# Added common commands
```

### 4. ✅ Configured direnv
```bash
echo "use flake" > .envrc
direnv allow
```

### 5. ✅ Updated Documentation
- README with new instructions
- Migration guide
- Tool guides

### 6. ✅ Verified Tests
```bash
just test
# All tests passing! ✅
```

## Results

### Removed
- 9 Bazel-related files
- ~1000 lines of configuration
- Complex workarounds
- Learning curve barriers

### Added
- 1 `flake.nix` file (~200 lines)
- 1 `Justfile` (~100 lines)
- Simpler workflow
- Better documentation

### Time Saved
- **Setup**: 2 hours → 5 minutes
- **Learning**: Days → Hours
- **Daily use**: Friction → Smooth

## When to Use Bazel vs Nix

### Use Bazel If:
- ✅ Massive monorepo (Google-scale)
- ✅ Complex build graph
- ✅ Multiple languages with deep integration
- ✅ Not using NixOS

### Use Nix Flakes If:
- ✅ NixOS user
- ✅ Want simple setup
- ✅ Standard project structure
- ✅ Value reproducibility but not extreme complexity

## Lessons Learned

### 1. Simpler Is Better
Don't over-engineer if you don't need to.

### 2. Native Support Matters
Using NixOS-native tools avoids workarounds.

### 3. Developer Experience First
If tools slow you down, switch tools.

### 4. Documentation Wins
Good docs > powerful but complex tools.

## Related Notes

- [[Nix Flakes]] - What we use now
- [[direnv]] - Auto-loading
- [[Just]] - Task runner
- [[Phase 1 - Infrastructure]] - Migration outcome
- [[Quick Start]] - Current setup

## Historical Documents

See `docs/archive/` for old Bazel documentation:
- `BAZEL_NIXOS_COMPLETE.md`
- `NIXOS_BAZEL_FIX.md`

---

#migration #bazel #nix #history #decision

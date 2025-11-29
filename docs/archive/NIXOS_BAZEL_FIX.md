# Fixing Bazel on NixOS 🔧

> **⚠️ OBSOLETE:** Bazel has been removed from this project.  
> This document is kept for historical reference only.  
> See [MIGRATION_TO_NIX_FLAKES.md](../../MIGRATION_TO_NIX_FLAKES.md) for current setup.

---

## The Problems

Bazel has **TWO** issues on NixOS:

### Problem 1: Missing `/bin/bash`
- Bash is located at `/run/current-system/sw/bin/bash` (managed by Nix)
- `/bin/bash` doesn't exist (NixOS doesn't use FHS - Filesystem Hierarchy Standard)
- Error: `execvp(/bin/bash, ...): No such file or directory`

### Problem 2: Cannot Find `gcc`
- gcc is in Nix paths, not standard locations like `/usr/bin/gcc`
- Error: `Auto-Configuration Error: Cannot find gcc or CC`
- Bazel's C/C++ toolchain detection fails

## Solutions

### ✅ **Complete Fix (Both Issues)**

#### Step 1: Fix gcc Detection (Already Done ✅)

We've updated `.bazelrc`:
```bash
# Inherit PATH from environment (includes Nix paths)
build --action_env=PATH

# Inherit CC from environment
build --action_env=CC
```

#### Step 2: Create /bin/bash Symlink (Required)

This is the simplest and most compatible solution for the bash issue.

#### Quick Method:
```bash
sudo ln -s $(which bash) /bin/bash
```

Then test Bazel (with CC set):
```bash
CC=$(which gcc) bazel test //backend/cmd/api:api_test
```

Or use the wrapper script:
```bash
./scripts/bazel-nix.sh test //backend/cmd/api:api_test
```

#### Automated Method:
Run our setup script:
```bash
./scripts/setup-nixos.sh
```

#### Permanent NixOS Configuration:
Add to `/etc/nixos/configuration.nix`:
```nix
{
  # Create /bin/bash symlink for compatibility
  system.activationScripts.binbash = {
    text = ''
      ln -sf ${pkgs.bash}/bin/bash /bin/bash
    '';
  };
}
```

Then rebuild:
```bash
sudo nixos-rebuild switch
```

---

### 🔄 **Solution 2: Use Go Test Instead of Bazel (Current Workaround)**

Since `go test` works perfectly, you can continue using it:

```bash
# Run all backend tests
cd backend && go test ./...

# Run specific package
cd backend && go test -v ./cmd/api

# With coverage
cd backend && go test -cover ./...
```

**Pros:**
- Works immediately
- No system changes needed
- Faster for small projects

**Cons:**
- Miss out on Bazel's caching and reproducibility
- Can't use Bazel's features (remote execution, etc.)

---

### 🔧 **Solution 3: Configure Bazel for NixOS (Advanced)**

We've already added some fixes to `.bazelrc`:

```bash
# Use system PATH
build --action_env=PATH=/run/current-system/sw/bin:/usr/bin:/bin

# Use local execution (less sandboxing)
build --spawn_strategy=local

# Show detailed errors
build --verbose_failures
```

But this doesn't fully solve the `/bin/bash` issue because Bazel hardcodes it internally.

---

### 🐚 **Solution 4: Use Nix Shell (Development Environment)**

We've created `shell.nix` for you:

```bash
# Enter Nix shell with all dependencies
nix-shell

# Or with direnv (auto-loads on cd)
direnv allow
```

This ensures consistent environment but still requires `/bin/bash` for Bazel.

---

## Testing Each Solution

### After Creating /bin/bash Symlink:

```bash
# Clean Bazel cache (important!)
bazel clean --expunge

# Run tests
bazel test //backend/cmd/api:api_test

# Expected output:
# ✅ PASSED in 0.1s
```

### Using Go Test (No Changes Needed):

```bash
cd backend
go test ./...

# Expected output:
# ✅ ok github.com/mafia-night/backend/cmd/api 0.001s
```

---

## Why This Happens

**NixOS Philosophy:**
- Everything in `/nix/store` (immutable, reproducible)
- No `/bin/bash`, `/usr/bin/python`, etc.
- Only `/bin/sh` exists (for POSIX scripts)

**Bazel Philosophy:**
- Expects FHS (Filesystem Hierarchy Standard)
- Hardcodes `/bin/bash` in build scripts
- Hermetic builds (isolated from system)

**The Conflict:**
- Bazel's hermetic builds clash with NixOS's non-FHS structure
- Creating `/bin/bash` is a compromise that works

---

## Recommended Approach

**For Development:**
1. Create `/bin/bash` symlink (one-time)
2. Use Bazel for full builds and reproducibility
3. Use `go test` for quick iterations

**For CI/CD:**
- Use Docker (where `/bin/bash` exists)
- Or use Nix-aware CI with the symlink

---

## Verification

Check if fix worked:

```bash
# 1. Verify /bin/bash exists
ls -la /bin/bash

# 2. Test Bazel
bazel test //backend/cmd/api:api_test

# 3. Should see:
# //backend/cmd/api:api_test     PASSED in 0.1s
```

---

## Additional Resources

- [Bazel on NixOS (official docs)](https://bazel.build/install/nixos)
- [NixOS and FHS compatibility](https://nixos.wiki/wiki/Packaging/Binaries)
- [rules_go issues with NixOS](https://github.com/bazelbuild/rules_go/issues)

---

## Current Status

- ✅ Go tests work: `cd backend && go test ./...`
- ❌ Bazel tests fail: Missing `/bin/bash`
- ✅ Frontend tests work: `cd frontend && npm test`
- ✅ Docker works: Has standard `/bin/bash`

**To enable Bazel tests:** Run `sudo ln -s $(which bash) /bin/bash`

---

## Quick Commands Summary

```bash
# Fix NixOS Bazel issue
sudo ln -s $(which bash) /bin/bash

# Test with Bazel
bazel test //backend/cmd/api:api_test

# Or use Go test (no fix needed)
cd backend && go test ./...

# Frontend always works
cd frontend && npm test
```

---

**Need help?** Check `./scripts/setup-nixos.sh` for automated setup!

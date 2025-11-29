# Complete Guide: Bazel on NixOS

## Two NixOS-Specific Issues

### Issue 1: Missing `/bin/bash` ❌
**Error:** `execvp(/bin/bash, ...): No such file or directory`

**Why:** NixOS doesn't use FHS (Filesystem Hierarchy Standard). Bash is at `/run/current-system/sw/bin/bash`, not `/bin/bash`.

### Issue 2: Cannot find `gcc` ❌  
**Error:** `Auto-Configuration Error: Cannot find gcc or CC`

**Why:** Bazel's toolchain detection doesn't look in Nix paths by default.

---

## The Complete Fix

### Step 1: Create `/bin/bash` Symlink

```bash
sudo ln -s $(which bash) /bin/bash
```

**For permanent solution**, add to `/etc/nixos/configuration.nix`:
```nix
{
  system.activationScripts.binbash = {
    text = ''
      ln -sf ${pkgs.bash}/bin/bash /bin/bash
    '';
  };
}
```

Then: `sudo nixos-rebuild switch`

### Step 2: Configure Bazel to Find gcc

We've already done this in `.bazelrc`:
```bash
# Inherit PATH from environment
build --action_env=PATH

# Inherit CC from environment
build --action_env=CC
```

### Step 3: Use nix-shell for Development

```bash
nix-shell  # Provides gcc, bash, go, node, etc.
```

---

## Three Ways to Run Bazel on NixOS

### Method 1: Direct (After Creating /bin/bash)

```bash
# One-time setup
sudo ln -s $(which bash) /bin/bash

# Then just use bazel
CC=$(which gcc) bazel test //backend/cmd/api:api_test
```

### Method 2: Use nix-shell + Wrapper Script

```bash
nix-shell
./scripts/bazel-nix.sh test //backend/cmd/api:api_test
```

The wrapper script checks:
- ✅ gcc is available
- ✅ bash is available  
- ✅ /bin/bash exists
- ✅ Sets CC environment variable

### Method 3: Use go test (Recommended for Now)

```bash
# Inside or outside nix-shell
cd backend && go test ./...
```

**Pros:**
- No Bazel issues
- Fast
- Works everywhere

**Cons:**
- Miss Bazel's caching
- Can't use Bazel-specific features

---

## Configuration Files Explained

### `.bazelrc` (Committed to Git)

```bash
# Generic configuration that works for everyone
build --action_env=PATH       # Use user's PATH
build --action_env=CC         # Use user's CC
build --spawn_strategy=local  # Less sandboxing
try-import %workspace%/.bazelrc.local  # User overrides
```

### `.bazelrc.local` (NOT Committed - User Specific)

```bash
# Your personal overrides
# Example if auto-detection fails:
# build --action_env=CC=/home/mehran/.nix-profile/bin/gcc
```

This file is in `.gitignore` so each user can have their own settings.

---

## Testing Each Solution

### Verify /bin/bash

```bash
ls -la /bin/bash
# Should show: /bin/bash -> /nix/store/.../bash
```

### Verify gcc

```bash
which gcc
gcc --version
# Should show: gcc (GCC) 14.3.0
```

### Test Bazel (After Both Fixes)

```bash
# Clean cache (important after config changes)
bazel clean --expunge

# Test with explicit CC
CC=$(which gcc) bazel test //backend/cmd/api:api_test
```

### Test in nix-shell

```bash
nix-shell
CC=$(which gcc) bazel test //backend/cmd/api:api_test
```

---

## Complete Setup Script

We've created `scripts/setup-nixos.sh`. Run it:

```bash
./scripts/setup-nixos.sh
```

It will:
1. Check if /bin/bash exists
2. Offer to create the symlink
3. Verify gcc is available
4. Test the setup

---

## Why This Happens

### NixOS Philosophy
```
/nix/store/xxx-bash/bin/bash     ✅ Reproducible, immutable
/nix/store/yyy-gcc/bin/gcc       ✅ Version-specific
/bin/bash                         ❌ Doesn't exist
/usr/bin/gcc                      ❌ Doesn't exist
```

### Standard Linux (FHS)
```
/bin/bash       ✅ Expected location
/usr/bin/gcc    ✅ Expected location
```

### Bazel Expectations
- Hardcodes `/bin/bash` in build scripts
- Looks for gcc in standard locations
- Expects FHS structure

### The Solution
- Create `/bin/bash` symlink (compromise)
- Use `--action_env=PATH` (inherit Nix paths)
- Use `--action_env=CC` (explicit compiler)

---

## Current Status

After applying fixes:

- ✅ gcc: Found via `--action_env=PATH` and `--action_env=CC`
- ⚠️ /bin/bash: Requires manual symlink creation
- ✅ nix-shell: Provides all tools
- ✅ go test: Works without any fixes

---

## Comparison: Different Approaches

| Approach | Setup | Speed | Issues |
|----------|-------|-------|--------|
| **go test** | None | ⚡⚡⚡ Fast | No Bazel features |
| **bazel (with fixes)** | /bin/bash symlink | ⚡⚡ Very Fast* | Needs setup |
| **nix-shell + bazel** | nix-shell + symlink | ⚡⚡ Very Fast* | Two dependencies |
| **Docker** | docker-compose | 🐢 Slow | No issues! |

*After initial build and cache warm-up

---

## Best Practice Recommendations

### For Daily Development
```bash
# Use go test - simple and fast
cd backend && go test ./...
```

### For CI/CD  
```bash
# Use Docker - consistent everywhere
docker-compose run backend go test ./...
```

### For Bazel Experimentation
```bash
# One-time setup
sudo ln -s $(which bash) /bin/bash

# Then use nix-shell
nix-shell
CC=$(which gcc) bazel test //...
```

---

## Troubleshooting

### Issue: "Cannot find gcc"
```bash
# Solution 1: Use nix-shell
nix-shell
CC=$(which gcc) bazel test //...

# Solution 2: Explicit CC
CC=/home/mehran/.nix-profile/bin/gcc bazel test //...
```

### Issue: "/bin/bash not found"
```bash
# Solution: Create symlink
sudo ln -s $(which bash) /bin/bash
```

### Issue: "Permission denied" for /bin
```bash
# Need sudo to modify /bin
sudo ln -sf $(which bash) /bin/bash
```

### Issue: Bazel cache issues after changes
```bash
# Clean and rebuild
bazel clean --expunge
bazel test //...
```

---

## Environment Variables Set

When using our setup:

```bash
PATH=/home/mehran/.nix-profile/bin:...    # Includes gcc
CC=/home/mehran/.nix-profile/bin/gcc      # Explicit compiler
```

---

## Files We Created

1. **`.bazelrc`** - Generic Bazel config
2. **`.bazelrc.local`** - User-specific overrides (not committed)
3. **`scripts/bazel-nix.sh`** - Wrapper script with checks
4. **`scripts/setup-nixos.sh`** - Automated setup
5. **`shell.nix`** - Nix development environment

---

## Quick Commands

```bash
# Create /bin/bash (one-time)
sudo ln -s $(which bash) /bin/bash

# Run tests with go
cd backend && go test ./...

# Run tests with Bazel (after fix)
CC=$(which gcc) bazel test //backend/cmd/api:api_test

# Use wrapper script
./scripts/bazel-nix.sh test //backend/cmd/api:api_test

# Use nix-shell
nix-shell
CC=$(which gcc) bazel test //...
```

---

## Next Steps

1. **If you want to use Bazel:**
   ```bash
   sudo ln -s $(which bash) /bin/bash
   ```

2. **If you prefer simplicity:**
   ```bash
   # Just use go test - it works perfectly!
   cd backend && go test ./...
   ```

3. **For the best experience:**
   ```bash
   # Use nix-shell for development
   nix-shell
   cd backend && go test ./...
   ```

---

**Summary:** Both issues (missing `/bin/bash` and missing `gcc`) are NixOS-specific. We've solved the gcc issue via `.bazelrc`. The `/bin/bash` issue requires a one-time symlink creation. For now, using `go test` is the simplest path forward! 🚀

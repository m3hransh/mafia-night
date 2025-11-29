# Quick Fix for Bazel on NixOS

## TL;DR

Run this command:
```bash
sudo ln -s $(which bash) /bin/bash
```

Then test:
```bash
bazel test //backend/cmd/api:api_test
```

## Why?

NixOS doesn't have `/bin/bash` (bash is in `/run/current-system/sw/bin/bash`), but Bazel expects it.

## Alternative

Use Go test directly (already works):
```bash
cd backend && go test ./...
```

See [NIXOS_BAZEL_FIX.md](../NIXOS_BAZEL_FIX.md) for detailed explanations.

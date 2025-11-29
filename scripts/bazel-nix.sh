#!/usr/bin/env bash
# Wrapper script to run Bazel with proper NixOS environment

set -e

# Ensure we have gcc in PATH
if ! command -v gcc &> /dev/null; then
    echo "❌ Error: gcc not found in PATH"
    echo "   Please run inside nix-shell or install gcc"
    exit 1
fi

# Ensure we have bash
if ! command -v bash &> /dev/null; then
    echo "❌ Error: bash not found in PATH"
    exit 1
fi

# Check if /bin/bash exists
if [ ! -e /bin/bash ]; then
    echo "❌ Error: /bin/bash does not exist"
    echo "   Run: sudo ln -s $(which bash) /bin/bash"
    exit 1
fi

# Export CC explicitly
export CC=$(command -v gcc)
export PATH="$PATH"

echo "🔧 Bazel NixOS Environment:"
echo "   CC:    $CC"
echo "   bash:  $(command -v bash)"
echo "   /bin/bash: ✅ exists"
echo ""

# Run bazel with all arguments passed to this script
exec bazel "$@"

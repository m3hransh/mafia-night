#!/usr/bin/env bash
# Setup script for NixOS to fix Bazel issues

set -e

echo "🔧 Setting up Mafia Night for NixOS"
echo ""

# Check if running on NixOS
if [ ! -f /etc/NIXOS ]; then
    echo "⚠️  Warning: This script is designed for NixOS"
    echo "   Other Linux distros should have /bin/bash by default"
fi

echo "Checking Bazel requirements..."
echo ""

# Check 1: gcc
if command -v gcc &> /dev/null; then
    echo "✅ gcc found: $(which gcc)"
    gcc --version | head -1
else
    echo "❌ gcc not found"
    echo "   Run: nix-shell"
    echo "   Or install: nix-env -iA nixpkgs.gcc"
    exit 1
fi

echo ""

# Check 2: /bin/bash
if [ -e /bin/bash ]; then
    echo "✅ /bin/bash already exists"
    ls -la /bin/bash
else
    echo "❌ /bin/bash does not exist"
    echo ""
    echo "To fix this, run:"
    echo "  sudo ln -s $(which bash) /bin/bash"
    echo ""
    
    # Ask if user wants to create symlink
    read -p "Create /bin/bash symlink now? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ln -s "$(which bash)" /bin/bash
        echo "✅ Created /bin/bash symlink"
    else
        echo "⏭️  Skipped. You can run Bazel tests manually later."
        exit 0
    fi
fi

echo ""
echo "🧪 Testing setup..."

# Test with go test (always works)
echo ""
echo "Testing with Go:"
cd "$(dirname "$0")/.."
cd backend && go test ./...

# Test with Bazel (if /bin/bash exists)
if [ -e /bin/bash ]; then
    echo ""
    echo "Testing with Bazel:"
    cd "$(dirname "$0")/.."
    CC=$(which gcc) bazel test //backend/cmd/api:api_test
fi

echo ""
echo "✨ Setup complete!"

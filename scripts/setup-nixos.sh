#!/usr/bin/env bash
# Setup script for NixOS to fix Bazel /bin/bash issue

set -e

echo "🔧 Setting up Mafia Night for NixOS"
echo ""

# Check if /bin/bash exists
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
        echo "⏭️  Skipped."
    fi
fi

echo ""
echo "✨ Setup complete!"

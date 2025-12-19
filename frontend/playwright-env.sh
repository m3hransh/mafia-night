#!/usr/bin/env bash
# Playwright Environment Setup for NixOS
# Source this file if direnv hasn't loaded the environment yet
#
# Usage: source ./playwright-env.sh

# Find system browser
BROWSER_PATH=$(which chromium 2>/dev/null || which google-chrome-stable 2>/dev/null || which chromium-browser 2>/dev/null)

if [ -z "$BROWSER_PATH" ]; then
  echo "❌ Error: No Chromium browser found in PATH"
  echo "   Please install chromium via Nix or ensure it's in your PATH"
  return 1
fi

# Export Playwright environment variables
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$BROWSER_PATH"

echo "✅ Playwright environment configured:"
echo "   Browser: $PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"
echo "   Version: $($PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH --version 2>/dev/null || echo 'unknown')"
echo ""
echo "You can now run: npm run test:e2e"

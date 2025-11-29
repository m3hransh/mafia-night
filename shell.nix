# Nix shell environment for Mafia Night development
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Go (use latest stable)
    go
    
    # Node.js
    nodejs_22
    
    # Bazel
    bazel_8
    
    # Database
    postgresql_16
    
    # Docker
    docker
    docker-compose
    
    # Build tools
    gcc
    gnumake
    
    # Shell
    bash
    
    # Optional: Development tools
    git
    gopls  # Go language server
    gotools  # goimports, etc.
  ];

  # Set up environment variables
  shellHook = ''
    export PATH="$HOME/.local/bin:$PATH"
    
    # Go environment
    export GOPATH="$HOME/go"
    export PATH="$GOPATH/bin:$PATH"
    
    # Create /bin/bash symlink if it doesn't exist (for Bazel)
    if [ ! -e /bin/bash ]; then
      echo ""
      echo "⚠️  NOTE: /bin/bash doesn't exist (required for Bazel)"
      echo "   Run: sudo ln -s $(which bash) /bin/bash"
      echo "   Or use 'go test' instead of 'bazel test'"
      echo ""
    fi
    
    echo "🎭 Mafia Night Development Environment"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Go:       $(go version | cut -d' ' -f3)"
    echo "Node:     $(node --version)"
    echo "Bazel:    $(bazel --version 2>/dev/null || echo 'Run: bazel --version')"
    echo "Postgres: ${pkgs.postgresql_16.version}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Quick commands:"
    echo "  cd backend && go test ./...      # Test backend"
    echo "  cd frontend && npm test          # Test frontend"
    echo "  docker-compose up                # Start all services"
    echo ""
  '';
}

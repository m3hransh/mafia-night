{
  description = "Mafia Night - A web application for managing physical Mafia games";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        # Backend build
        backend = pkgs.buildGoModule {
          pname = "mafia-night-backend";
          version = "0.1.0";
          src = ./backend;
          vendorHash = null;
          
          buildPhase = ''
            runHook preBuild
            go build -o api ./cmd/api
            runHook postBuild
          '';
          
          installPhase = ''
            runHook preInstall
            mkdir -p $out/bin
            cp api $out/bin/
            runHook postInstall
          '';
          
          meta = {
            description = "Mafia Night API server";
            license = pkgs.lib.licenses.mit;
          };
        };
        
      in
      {
        # Packages that can be built with `nix build`
        packages = {
          inherit backend;
          default = backend;
        };

        # Development shell with `nix develop`
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Go
            go
            gopls
            gotools
            go-tools
            delve

            # Node.js
            nodejs_22
            nodePackages.typescript
            nodePackages.typescript-language-server

            # Database
            postgresql_16

            # Docker
            docker
            docker-compose

            # Build tools
            gcc
            gnumake

            # Development tools
            git
            gh
            just
            mkcert

            # Formatters & Linters
            gofumpt
            golangci-lint
            nixpkgs-fmt
            pgcli

            # E2E Testing - Playwright with browsers
            playwright-driver.browsers
          ];

          shellHook = ''
            export GOPATH="$HOME/go"
            export PATH="$GOPATH/bin:$PATH"

            # Playwright environment variables for NixOS
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"

            # Install gotestsum if not present
            if ! command -v gotestsum &> /dev/null; then
              echo "📦 Installing gotestsum..."
              go install gotest.tools/gotestsum@latest 2>/dev/null
            fi

            echo ""
            echo "🎭 Mafia Night Development Environment"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Go:       $(go version | cut -d' ' -f3)"
            echo "Node:     $(node --version)"
            echo "Postgres: ${pkgs.postgresql_16.version}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "📂 Project structure:"
            echo "  backend/   → Go API server"
            echo "  frontend/  → Next.js app"
            echo ""
            echo "🚀 Quick commands:"
            echo "  just test-backend                 # Test backend"
            echo "  cd frontend && npm test           # Test frontend"
            echo "  cd frontend && npm run test:e2e   # E2E tests (Playwright)"
            echo "  docker-compose up                 # Start all services"
            echo ""
            echo "🔧 Build commands:"
            echo "  nix build                         # Build backend"
            echo "  nix run                           # Run backend"
            echo ""
          '';
        };

        # Apps that can be run with `nix run`
        apps.default = {
          type = "app";
          program = "${backend}/bin/api";
        };
      }
    );
}

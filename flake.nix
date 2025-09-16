{
  description = "Linker Chat Backend - NestJS Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        packages = nixpkgs.legacyPackages.${system};

        # Node.js version 22 (LTS)
        nodejs = packages.nodejs_22;

        # Development setup script
        dev-setup = packages.writeShellScriptBin "dev-setup" ''
          echo "Setting up development environment..."

          # Install npm dependencies
          echo "Installing npm dependencies..."
          npm install

          echo ""
          echo "🎉 Development environment setup complete!"
          echo ""
          echo "Available commands:"
          echo "  npm run dev           - Start development server"
          echo "  npm run build         - Build the application"
          echo "  npm run test          - Run tests"
          echo "  npm run migration:run - Run database migrations"
          echo ""
          echo "📝 Note: Make sure you have MySQL running globally and create the database if needed:"
          echo "  CREATE DATABASE IF NOT EXISTS linker_chat;"
          echo ""
        '';

        # Project status script
        project-status = packages.writeShellScriptBin "project-status" ''
          echo "📊 Project Status:"
          echo ""

          # Check Node.js version
          echo "Node.js: $(node --version)"
          echo "npm: $(npm --version)"

          # Check if dependencies are installed
          if [ -d "node_modules" ]; then
            echo "✅ Dependencies: Installed"
          else
            echo "❌ Dependencies: Not installed (run 'npm install')"
          fi

          # Check MySQL global connection
          if command -v mysql &> /dev/null; then
            echo "✅ MySQL: Available globally"
            # Try to connect to check if server is running
            if mysql -u root -e "SELECT 1;" &> /dev/null; then
              echo "✅ MySQL Server: Running and accessible"
              # Check if database exists
              DB_EXISTS=$(mysql -u root -e "SHOW DATABASES LIKE 'linker_chat';" 2>/dev/null | grep linker_chat || echo "")
              if [ -n "$DB_EXISTS" ]; then
                echo "✅ Database: linker_chat exists"
              else
                echo "❌ Database: linker_chat not found (run: mysql -u root -e \"CREATE DATABASE linker_chat;\")"
              fi
            else
              echo "❌ MySQL Server: Not running or not accessible"
            fi
          else
            echo "❌ MySQL: Not found globally"
          fi

          echo ""
        '';

      in
      {
        devShells.default = packages.mkShell {
          buildInputs = with packages; [
            # Core development tools
            nodejs
            npm-check-updates
            yarn

            # Custom scripts
            dev-setup
            project-status
          ];

          shellHook = ''
            echo "🚀 Welcome to Linker Chat Backend Development Environment!"
            echo ""
            echo "  - Node.js: $(node --version)"
            echo "  - npm: $(npm --version)"
            echo "  - Yarn: $(yarn --version)"
            echo ""

            echo "🛠️  Quick start commands:"
            echo "  - dev-setup           - Setup development environment"
            echo "  - project-status      - Check project status"
            echo "  - npm run dev         - Start development server"
            echo ""
            echo "🛠️  MySQL Requirements:"
            echo "  - Make sure MySQL is installed and running globally"
            echo "  - Create database: mysql -u root -e \"CREATE DATABASE IF NOT EXISTS linker_chat;\""
            echo "  - Run migrations: npm run migration:run"
            echo ""

            # Set environment variables
            export NODE_ENV=development
            export DB_HOST=localhost
            export DB_PORT=3306
            export DB_USERNAME=root
            export DB_PASSWORD=""
            export DB_DATABASE=linker_chat
          '';

          # Environment variables for the shell
          DB_HOST = "localhost";
          DB_PORT = "3306";
          DB_USERNAME = "root";
          DB_PASSWORD = "";
          DB_DATABASE = "linker_chat";
        };
      }
    );
}

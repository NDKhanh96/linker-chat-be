# Nix Development Environment Guide

## Prerequisites

1. **Install Nix with flakes support:**
   ```bash
   # On macOS
   curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
   
   # Or using the official installer
   sh <(curl -L https://nixos.org/nix/install)
   ```

2. **Enable flakes (if using official installer):**
   ```bash
   mkdir -p ~/.config/nix
   echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
   ```

3. **Install MySQL globally:**
   ```bash
   # On macOS with Homebrew
   brew install mysql
   brew services start mysql
   
   # On Ubuntu/Debian
   sudo apt install mysql-server
   sudo systemctl start mysql
   
   # On other systems, follow your distribution's MySQL installation guide
   ```

4. **Optional: Install direnv for automatic environment activation:**
   ```bash
   # On macOS with Homebrew
   brew install direnv
   
   # Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
   eval "$(direnv hook zsh)"  # for zsh
   eval "$(direnv hook bash)" # for bash
   ```

## Getting Started

### Method 1: Using Nix Flake Directly

1. **Enter the development environment:**
   ```bash
   cd /path/to/linker-chat-be
   nix develop
   ```

2. **Setup the development environment (first time only):**
   ```bash
   dev-setup
   ```

3. **Create the database (first time only):**
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS linker_chat;"
   ```

4. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

5. **Check project status:**
   ```bash
   project-status
   ```

6. **Start development:**
   ```bash
   npm run dev
   ```

### Method 2: Using direnv (Automatic)

1. **Allow direnv for this directory:**
   ```bash
   cd /path/to/linker-chat-be
   direnv allow
   ```

2. **The environment will automatically activate when you enter the directory**

## Available Commands

### Project Management
- `dev-setup` - Complete development environment setup
- `project-status` - Check the status of all components
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

### Database Management
- `npm run migration:run` - Run database migrations
- `npm run migration:generate -- --name=YourMigrationName` - Generate new migration
- `mysql -u root -p` - Connect to MySQL CLI (global)

### Development Tools
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run ts-check` - Type check without emitting files

## Environment Variables

The following environment variables are automatically set:

- `NODE_ENV=development`
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USERNAME=root`
- `DB_PASSWORD=""`
- `DB_DATABASE=linker_chat`

You can override these by creating a `.env` file in the project root.

## Database Setup

This project uses a **global MySQL installation**. Make sure you have MySQL installed and running on your system:

1. **Database connection:** localhost:3306
2. **Default user:** root
3. **Default database:** linker_chat
4. **Create database:** `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS linker_chat;"`

### Setup Steps:
```bash
# Start MySQL service (if not running)
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Linux

# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS linker_chat;"

# Run migrations
npm run migration:run
```

## Troubleshooting

### MySQL connection issues
```bash
# Check if MySQL is running
brew services list | grep mysql  # macOS
# or
sudo systemctl status mysql  # Linux

# Start MySQL if not running
brew services start mysql  # macOS
# or
sudo systemctl start mysql  # Linux

# Test connection
mysql -u root -p -e "SELECT 1;"

# Create database if missing
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS linker_chat;"
```

### Dependencies issues
```bash
# Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
```bash
# Recreate the database
mysql -u root -p -e "DROP DATABASE IF EXISTS linker_chat; CREATE DATABASE linker_chat;"

# Run migrations
npm run migration:run
```

### Nix cache issues
```bash
# Clear Nix cache and rebuild
nix-collect-garbage
nix develop --rebuild
```

## What's Included

This Nix flake provides:

- **Node.js 22** (LTS version as specified in `.node-version`)
- **Development tools:** git, curl, jq, npm-check-updates
- **Custom scripts** for project management
- **Automatic environment variable setup**
- **Isolated development environment** (no conflicts with system packages)

**Note:** MySQL is expected to be installed globally on your system.

## Benefits of Using Nix

- ✅ **Reproducible builds** - Same environment across all machines
- ✅ **Isolation** - No conflicts with system packages
- ✅ **Easy rollback** - Can switch between different environments
- ✅ **Team consistency** - Everyone uses the exact same tools
- ✅ **No global installs** - Everything is contained within the project

#!/bin/bash

# Workforce Luxembourg - Setup Script
# Automates local development environment setup

set -e

echo "🚀 Workforce Luxembourg - Setup Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm found: $(pnpm --version)${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git found: $(git --version)${NC}"

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔧 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# DeepSeek Configuration
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# App Configuration
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
EOF
    echo -e "${YELLOW}⚠️  Created .env.local - Please update with your credentials${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

echo ""
echo "🗄️  Setting up database..."

# Check if using local PostgreSQL or Supabase
read -p "Use local PostgreSQL with Docker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker${NC}"
        exit 1
    fi
    echo "Starting Docker containers..."
    docker-compose up -d postgres redis
    echo -e "${GREEN}✓ Docker containers started${NC}"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
    
    # Update .env.local for local DB
    sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL=postgresql://workforce:workforce_dev_password@localhost:5432/workforce_luxembourg|' .env.local
else
    echo -e "${YELLOW}⚠️  Make sure to set SUPABASE credentials in .env.local${NC}"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Update .env.local with your credentials:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - DEEPSEEK_API_KEY"
echo ""
echo "2. Start development server:"
echo "   pnpm dev"
echo ""
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "📖 Documentation:"
echo "   - DEPLOYMENT_GUIDE.md - Full deployment instructions"
echo "   - README.md - Project overview"
echo "   - ARCHITECTURE_REQUIREMENTS.md - Technical architecture"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"

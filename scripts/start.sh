#!/bin/bash

# Pocket Doctor App Startup Script
# Usage: ./start.sh [web|ios|android|tunnel]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌵 Pocket Doctor App Startup${NC}"
echo "============================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Not in the project directory. Please run from project root.${NC}"
    exit 1
fi

# Kill any existing expo processes
echo -e "${GREEN}🔄 Cleaning up existing processes...${NC}"
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}📦 Installing dependencies...${NC}"
    npm install
fi

# Parse command line argument
MODE=${1:-tunnel}

echo -e "${GREEN}🚀 Starting in $MODE mode...${NC}"

case $MODE in
    "web")
        npx expo start --web --clear
        ;;
    "ios")
        npx expo start --ios --clear
        ;;
    "android")
        npx expo start --android --clear
        ;;
    "tunnel"|"")
        npx expo start --tunnel --clear
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 [web|ios|android|tunnel]${NC}"
        echo "  web     - Start in web browser"
        echo "  ios     - Start in iOS simulator"
        echo "  android - Start in Android emulator"
        echo "  tunnel  - Start with tunnel (default)"
        exit 1
        ;;
esac

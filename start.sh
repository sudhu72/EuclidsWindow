#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PORT="${HOST_PORT:-8000}"
PROJECT_NAME="Euclid's Window"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ${PROJECT_NAME} - Docker Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Docker is not running${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if docker-compose exists
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}✗ Error: docker compose not found${NC}"
    echo "Please install Docker Compose and try again."
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is available${NC}"
echo ""

# Stop any existing containers
echo -e "${YELLOW}→ Stopping existing containers...${NC}"
docker compose down 2>/dev/null || true
echo ""

# Build and start containers
echo -e "${YELLOW}→ Building Docker images...${NC}"
echo "This may take a few minutes on first run..."
docker compose build --no-cache
echo ""

echo -e "${YELLOW}→ Starting containers...${NC}"
docker compose up -d
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}→ Waiting for services to start...${NC}"
sleep 3

# Check if Ollama is healthy
echo -n "Checking Ollama service... "
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker compose exec -T ollama ollama list > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
    echo -n "."
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Ollama service failed to start${NC}"
    exit 1
fi

# Check if main app is responding
echo -n "Checking main application... "
sleep 2
MAX_RETRIES=15
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s "http://localhost:${PORT}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 2
    echo -n "."
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Application failed to start${NC}"
    echo "Check logs with: docker compose logs"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🚀 App is Ready! 🚀           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}→ Open in browser:${NC}"
echo -e "   ${GREEN}http://localhost:${PORT}${NC}"
echo ""
echo -e "${BLUE}→ Useful commands:${NC}"
echo -e "   View logs:       ${YELLOW}docker compose logs -f${NC}"
echo -e "   Stop app:        ${YELLOW}docker compose down${NC}"
echo -e "   Restart:         ${YELLOW}./start.sh${NC}"
echo -e "   View containers: ${YELLOW}docker compose ps${NC}"
echo ""

# Optionally open browser (uncomment if you want auto-open)
# if command -v open &> /dev/null; then
#     open "http://localhost:${PORT}"
# fi

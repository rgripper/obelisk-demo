#!/bin/bash
# Build all packages in the monorepo
set -e

echo "========================================"
echo "Building Obelisk Demo Monorepo"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build shared types first (dependency for others)
echo -e "\n${BLUE}[1/3] Building shared types...${NC}"
cd packages/shared
bun run build
cd ../..
echo -e "${GREEN}✓ Shared types built${NC}"

# Build workflows
echo -e "\n${BLUE}[2/3] Building workflows...${NC}"
cd packages/workflows
bun run build
cd ../..
echo -e "${GREEN}✓ Workflows built${NC}"

# Build all activities
echo -e "\n${BLUE}[3/3] Building activities...${NC}"
for activity in packages/activities/*; do
    if [ -d "$activity" ]; then
        activity_name=$(basename "$activity")
        echo "  Building $activity_name..."
        cd "$activity"
        bun run build
        cd ../../..
        echo -e "${GREEN}  ✓ $activity_name built${NC}"
    fi
done

echo -e "\n${GREEN}========================================"
echo "Build complete!"
echo "========================================${NC}"
echo ""
echo "WASM components generated:"
echo "  - packages/workflows/dist/ticket-resolution.wasm"
echo "  - packages/activities/ai-activities/dist/*.wasm"
echo "  - packages/activities/ticket-activities/dist/*.wasm"
echo "  - packages/activities/notify-activities/dist/*.wasm"

#!/bin/bash
# Clean all build artifacts
set -e

echo "Cleaning all build artifacts..."

# Clean shared
rm -rf packages/shared/dist

# Clean workflows
rm -rf packages/workflows/dist

# Clean all activities
for activity in packages/activities/*; do
    if [ -d "$activity" ]; then
        rm -rf "$activity/dist"
    fi
done

echo "✓ All build artifacts cleaned"

#!/usr/bin/env bash
set -euo pipefail

# Maestro Desktop Release Script
# Creates a GitHub release for the desktop app

REPO="yangxiangnanwill/oh-my-maestro"
VERSION=$(node -e "console.log(require('./package.json').version)")
TAG="maestro-desktop-v${VERSION}"

echo "=== Maestro Desktop Release v${VERSION} ==="

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo "Error: gh CLI not found. Install from https://cli.github.com/"
    exit 1
fi

# Check if tag exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "Tag $TAG already exists"
else
    echo "Creating tag $TAG..."
    git tag -a "$TAG" -m "Maestro Desktop v${VERSION}"
    git push origin "$TAG"
fi

echo "Release tag $TAG pushed. GitHub Actions will handle the build."

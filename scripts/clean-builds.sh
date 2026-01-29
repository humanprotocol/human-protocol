#!/usr/bin/env bash
set -e

echo "🧹 Cleaning build artifacts..."

# Common build/output dirs
DIRS=(
  dist
  build
  out
  .next
  .nuxt
  .svelte-kit
  .vercel
  .cache
  .parcel-cache
  coverage
  .turbo
  .nx
)

# Remove build dirs everywhere
for dir in "${DIRS[@]}"; do
  find . -name "$dir" -type d -prune -exec rm -rf '{}' +
done

# Optional: TS build info
find . -name "*.tsbuildinfo" -type f -delete

echo "✅ Build artifacts cleaned"

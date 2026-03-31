#!/bin/bash
set -e

cd /Users/anirudhmanjesh/hackathons/content-os

# Install dependencies if node_modules is missing or stale
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Environment ready."

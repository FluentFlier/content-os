#!/bin/bash
set -e

cd /Users/anirudhmanjesh/hackathons/content-os

# Install dependencies if node_modules is stale
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  npm install
fi

# Verify .env.local exists (user must provide credentials)
if [ ! -f ".env.local" ]; then
  echo "WARNING: .env.local not found. InsForge API calls will fail."
  echo "Copy .env.example to .env.local and fill in credentials."
fi

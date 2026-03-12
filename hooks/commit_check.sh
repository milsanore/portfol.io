#!/bin/bash
set -euo pipefail

echo "Running pre-commit checks..."

echo "[1/4] Checking formatting..."
npm run format:check

echo "[2/4] Running linter..."
npm run lint

echo "[3/4] Running type check..."
npm run typecheck

echo "[4/4] Running unit tests..."
npm run test

echo "All checks passed."

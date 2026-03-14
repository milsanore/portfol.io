#!/usr/bin/env sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$DIR"/*.js; do
  echo "==> k6 run $f"
  k6 run "$f"
done

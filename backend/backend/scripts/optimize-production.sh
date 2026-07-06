#!/usr/bin/env bash
# Optimize Laravel for production (run from backend/ after deploy)
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Clearing old caches..."
php artisan optimize:clear

echo "Caching config, routes, views, events..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "Done. Ensure APP_DEBUG=false and Redis is running for best performance."

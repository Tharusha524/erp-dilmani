# Optimize Laravel for production (run from backend/ after deploy)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "Clearing old caches..."
php artisan optimize:clear

Write-Host "Caching config, routes, views, events..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

Write-Host "Done. Ensure APP_DEBUG=false and Redis is running for best performance."

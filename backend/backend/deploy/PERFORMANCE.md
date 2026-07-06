# Backend performance deployment guide

## Quick start (after code deploy)

```powershell
cd backend
copy deploy\production.env.example .env   # edit values first time only
.\scripts\optimize-production.ps1
```

```bash
cd backend
cp deploy/production.env.example .env   # edit values first time only
chmod +x scripts/optimize-production.sh
./scripts/optimize-production.sh
```

## Checklist

| Step | File / action |
|------|----------------|
| 1. Production `.env` | `deploy/production.env.example` → `APP_DEBUG=false`, Redis |
| 2. Laravel cache | `scripts/optimize-production.ps1` |
| 3. Nginx + PHP-FPM | `deploy/nginx-erp.conf.example` |
| 4. OPcache | `deploy/opcache.ini.example` |
| 5. MySQL tuning | `deploy/mysql.cnf.example` |
| 6. Redis install | https://redis.io — then set `CACHE_STORE=redis` |

## API pagination (optional)

List endpoints support optional pagination without breaking existing clients:

```
GET /api/debtors-masters?paginate=1&per_page=50&page=1
GET /api/sales-orders?paginate=1
GET /api/purch-orders?paginate=1
GET /api/suppliers?paginate=1
GET /api/stock-masters?paginate=1
GET /api/work-orders?paginate=1
```

Without `paginate` / `page` / `per_page`, the full list is returned (backward compatible).

## Dashboard cache

- Summary cached `DASHBOARD_CACHE_SECONDS` (default 300s)
- Alerts cached `DASHBOARD_ALERTS_CACHE_SECONDS` (default 120s)
- Set either to `0` in `.env` to disable

## Development vs production

| Setting | Dev | Production |
|---------|-----|------------|
| APP_DEBUG | true | **false** |
| CACHE_STORE | database | **redis** |
| php artisan serve | OK | **use Nginx** |
| config:cache | skip | **run** |

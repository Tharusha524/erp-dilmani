# Grow Ledger ERP (sky_erp)

Full-stack Enterprise Resource Planning (ERP) system for sales, purchasing, inventory, banking, general ledger, manufacturing, fixed assets, and multi-dimensional accounting.

## Architecture

| Layer    | Path              | Stack                              |
|----------|-------------------|------------------------------------|
| API      | `backend/backend` | Laravel 12, PHP 8.2+, Sanctum      |
| Frontend | `new_account`     | React 18, TypeScript, Vite 6, MUI  |

```
erp-new/
├── backend/backend/     # Laravel REST API
├── new_account/         # React SPA (served at /sky_erp/)
├── docker-compose.yml   # Local development stack
└── README.md
```

## Features

- **Sales** — quotations, orders, deliveries, invoices, payments, credit notes, POS, recurrent invoices
- **Purchases** — purchase orders, GRN, supplier invoices, payments, allocations
- **Inventory** — items, locations, transfers, adjustments, pricing, stock movements
- **Banking & GL** — chart of accounts, journals, bank reconciliation, trial balance, P&L, balance sheet
- **Manufacturing** *(optional module)* — BOM, work orders, issue/produce/cost
- **Fixed Assets** *(optional module)* — purchase, transfer, disposal, depreciation
- **Dimensions** *(optional module)* — analytical tagging on GL entries
- **Security** — role-based permissions, login throttling, IP restrictions, audit trail
- **AI Assistant** — in-app chat and voice transcription (OpenAI-compatible providers)
- **System** — backups, PDF documents, dashboard alerts, company setup

## Prerequisites

### Local development (without Docker)

- PHP 8.2+ and Composer
- Node.js 18+
- MySQL 8+

### Docker development

- Docker Desktop (or Docker Engine + Docker Compose v2)

## Quick Start (Local)

### Backend

```bash
cd backend/backend
cp .env.example .env
composer install
php artisan key:generate
# Configure DB_* in .env
php artisan migrate --seed
php artisan serve
```

API: `http://127.0.0.1:8000`

### Frontend

```bash
cd new_account
cp .env.example .env
# For local dev, set in .env:
#   VITE_API_BASE_URL=/api
#   VITE_API_PROXY_TARGET=http://127.0.0.1:8000
npm install
npm run dev
```

App: `http://localhost:5173/sky_erp/` (Vite proxies `/api` to Laravel)

### Combined dev (from backend)

```bash
cd backend/backend
composer dev
```

Runs Laravel server, queue worker, and Vite concurrently.

## Docker

Docker Compose runs MySQL, Redis, the Laravel API, and the Vite frontend for local development.

### Services

| Service   | Port  | Description                    |
|-----------|-------|--------------------------------|
| `mysql`   | 3306  | MySQL 8 database               |
| `redis`   | 6379  | Cache, queue, sessions         |
| `backend` | 8000  | Laravel API (`php artisan serve`) |
| `frontend`| 5173  | React dev server (Vite)        |

### Start the stack

```bash
# From project root
docker compose up -d --build
```

First run (migrations + seed):

```bash
docker compose exec backend php artisan migrate --seed
```

### URLs (Docker)

- Frontend: http://localhost:5173/sky_erp/
- API: http://localhost:8000/api

### Stop

```bash
docker compose down
```

Remove database volume:

```bash
docker compose down -v
```

### Environment (Docker)

Backend uses `backend/backend/.env.docker` as a template. On first `docker compose up`, copy or merge into `.env`:

```bash
cp backend/backend/.env.docker backend/backend/.env
docker compose exec backend php artisan key:generate
```

Key Docker-related variables:

| Variable       | Docker value |
|----------------|--------------|
| `DB_HOST`      | `mysql`      |
| `REDIS_HOST`   | `redis`      |
| `APP_URL`      | `http://localhost:8000` |

Frontend `.env` for Docker:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://backend:8000
```

## Production Deployment

Production is typically deployed on **Nginx + PHP-FPM + MySQL + Redis** (see `backend/backend/deploy/`).

```bash
# Build frontend
cd new_account
npm run build
# Deploy dist/ to web root (e.g. public_html/sky_erp/)
```

Guides:

- `backend/backend/deploy/CYBERPANEL.md` — CyberPanel / shared hosting
- `backend/backend/deploy/PERFORMANCE.md` — Redis, OPcache, Nginx tuning
- `backend/backend/deploy/production.env.example` — production environment template

## Environment Variables

### Backend (`backend/backend/.env`)

See `.env.example` for full list. Important groups:

- **App** — `APP_NAME`, `APP_URL`, `APP_KEY`, `APP_DEBUG`
- **Database** — `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- **Auth** — `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`
- **AI** — `AI_ENABLED`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`

### Frontend (`new_account/.env`)

| Variable                  | Purpose                          |
|---------------------------|----------------------------------|
| `VITE_API_BASE_URL`       | API endpoint                     |
| `VITE_API_PROXY_TARGET`   | Local/Docker Laravel URL         |

## Database

- **Engine:** MySQL 8
- **Migrations:** `backend/backend/database/migrations/`
- **Seeders:** chart of accounts, currencies, roles, demo data

```bash
php artisan migrate
php artisan db:seed
```

## Repository

```bash
git clone https://github.com/Danushka20/erp-new.git
cd erp-new
```

## License

Proprietary — all rights reserved.

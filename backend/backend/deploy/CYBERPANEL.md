# Grow Ledger ERP — CyberPanel (Terminal nænam)

CyberPanel eke **Terminal næ**, Windows **CMD næ** — me guide eke **GUI only** methods thiyenawa.

---

## Quick pick — obage situation eka

| Situation | Method |
|-----------|--------|
| Terminal næ, SSH puluwan næ | **Method A** — Cron Jobs + **Method C** — Browser script |
| Windows PC eken server ekata connect karanna puluwan | **Method B** — PuTTY SSH (Terminal UI one næ) |
| Commands run karanna ba | **Method D** — File Manager only (basic setup) |

---

## Method A — Cron Jobs (Terminal one næ) ⭐ Recommended

CyberPanel eke **Cron Jobs** menu thiyenawa — meken commands run karanna puluwan.

### Step 1 — Path find karanna

**Websites → List Websites → Manage → File Manager**

Laravel `artisan` file eka thiyena folder path eka note karanna. Example:
```
/home/erp.yourdomain.com/backend
```

### Step 2 — One-time optimize cron

**Cron Jobs → Create Cron Job**

| Field | Value |
|-------|--------|
| Select Website | obage domain |
| Minute | `5` *(next 5 min eke run wenne)* |
| Hour | current hour |
| Day | today |
| Month | `*` |
| Weekday | `*` |
| Command | see below |

**Command** (path eka change karanna):
```
cd /home/erp.yourdomain.com/backend && php artisan optimize:clear && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache
```

Cron run wela pasu **Cron Jobs eken me job eka delete karanna** (one-time only).

### Step 3 — Migrate only (aluth cron ekak)

Migration run karanna oni nam:
```
cd /home/erp.yourdomain.com/backend && php artisan migrate --force
```

### Step 4 — Daily scheduler (optional)

| Minute | Hour | Command |
|--------|------|---------|
| `*` | `*` | `cd /home/erp.yourdomain.com/backend && php artisan schedule:run >> /dev/null 2>&1` |

---

## Method B — PuTTY SSH (CyberPanel Terminal næ, PC eken connect)

CyberPanel web Terminal nænam **server eke SSH usually open** thiyenawa. Obage Windows PC eken connect karanna puluwan.

### Step 1 — Server details ganna

CyberPanel → **Dashboard** or hosting provider email:
- **Server IP** (e.g. `123.45.67.89`)
- **SSH username** (usually `root` or CyberPanel user)
- **SSH password** or SSH key

### Step 2 — PuTTY download & connect

1. [PuTTY download](https://www.putty.org/) — Windows eke install karanna
2. PuTTY open → **Host Name**: server IP → **Port**: `22` → **Open**
3. Username/password enter karanna

### Step 3 — Commands run karanna

```bash
cd /home/erp.yourdomain.com/backend
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

**Windows 10/11** eke PowerShell eken:
```powershell
ssh root@123.45.67.89
```

---

## Method C — Browser one-time script (Terminal + SSH nænam)

Terminal ha SSH dekeka nænam me use karanna.

### Step 1 — File copy karanna

1. `deploy/panel-deploy.php.example` file eka copy karanna
2. Rename: `backend/public/panel-deploy.php`
3. File eke `DEPLOY_TOKEN` change karanna — long random string ekak (e.g. `a8f3k2m9x7p1q4w6`)

### Step 2 — Browser eken run karanna

```
https://erp.yourdomain.com/panel-deploy.php?token=a8f3k2m9x7p1q4w6
```

Page eke commands run wela "Done" penni nam...

### Step 3 — File DELETE karanna 🔴

File Manager eken **`public/panel-deploy.php` delete karanna** — security risk nætha wenna.

Code update wela pasu me file upload karala run karala delete karanna puluwan.

---

## Method D — File Manager only (commands run karanna ba)

Artisan commands run karanna ba nam me minimum setup eken system chalanna puluwan (slow, but works).

### 1. Document root

**Websites → Manage → Change Doc Root** → `backend/public`

### 2. `.env` edit (File Manager)

Path: `backend/.env`

```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error

# Redis install karanna ba nam database use karanna:
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

DASHBOARD_CACHE_SECONDS=300
DASHBOARD_ALERTS_CACHE_SECONDS=120
```

Redis terminal nænam **database cache** use karanna — extra install one næ.

### 3. Folder permissions (File Manager)

`storage/` ha `bootstrap/cache/` folders:
- Right-click → **Permissions** → `775` (or `755` if 775 fail)
- Subfolders apply karanna option thiyenam tick karanna

### 4. Database migrations

**Option 1:** Method A (Cron) or Method C (browser script) use karala `migrate --force` run karanna.

**Option 2:** Local PC eken database export karala **phpMyAdmin** eken import karanna:
- CyberPanel → **Databases → phpMyAdmin**

### 5. OPcache (UI only)

**CyberPanel → PHP → Edit PHP Configs** → PHP version select → add:

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
```

Save karanna — LiteSpeed usually auto restart.

### 6. SSL

**SSL → Manage SSL → Issue SSL** (Let's Encrypt)

`.env`: `APP_URL=https://erp.yourdomain.com`

---

## Site setup (all methods)

1. **Websites → Create Website**
2. **File Manager** — backend upload (zip extract karanna puluwan)
3. **Databases** — MySQL database create → `.env` eke credentials set karanna
4. Document root → `backend/public`

---

## Frontend deploy (File Manager)

Local PC eken:
```powershell
cd new_account
npm run build
```

`dist/` folder CyberPanel **File Manager** eken upload karanna.

---

## Redis (optional — terminal nænam skip karanna)

Redis install karanna terminal/SSH one. **Skip karala** `.env` eke:
```env
CACHE_STORE=database
SESSION_DRIVER=database
```

Mehema system chalanna puluwan — Redis wadi fast, but database cache enough for start.

---

## After code update (no Terminal)

1. **Method A:** Cron job ekak add karala optimize command run karanna, pasu delete
2. **Method C:** `panel-deploy.php` upload → browser eken run → delete
3. **Method B:** PuTTY eken SSH connect karala commands run karanna

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 500 error | File Manager → `storage/logs/laravel.log` balanna |
| Permission denied | File Manager → `storage` & `bootstrap/cache` → Permissions 775 |
| Cron not running | Path correct da check — `artisan` file thiyena folder |
| Redis error | `.env` eke `CACHE_STORE=database` set karanna |
| Slow dashboard | `DASHBOARD_CACHE_SECONDS=300` set karanna |
| panel-deploy 403 | URL eke `?token=` correct da check |

---

## Summary checklist (Terminal nænam)

- [ ] Document root → `backend/public`
- [ ] `.env` → `APP_DEBUG=false`, `CACHE_STORE=database`
- [ ] Folder permissions → `storage`, `bootstrap/cache`
- [ ] **Cron Job** or **panel-deploy.php** eken migrate + cache
- [ ] OPcache enabled (PHP Configs UI)
- [ ] SSL issued
- [ ] Frontend build uploaded
- [ ] `panel-deploy.php` delete karala thiyenawa da check karanna

Issues thiyenam exact error message eka kiyanna.

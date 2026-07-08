# SANGAM — Phase 1 Foundation

Scaffold for the AI-first MFD operating system, built from your Master Blueprint v1.
This is the **Foundation** phase: auth, RBAC, security, DB schema, and a UI shell.
Not the full 100+ module product — that gets built module-by-module on top of this.

## What's in the box

```
backend/   NestJS + Prisma + PostgreSQL — auth, RBAC, audit log, encrypted PII, investors module
frontend/  Next.js + Tailwind — login, dashboard shell, gold/ivory dark theme
docker-compose.yml   local Postgres + Redis
```

## Security built in (per your blueprint priorities)

- JWT access (15min) + refresh (7d) tokens, **refresh tokens persisted and revocable** — logout is permanent, not just client-side
- Argon2 password hashing
- 2FA-ready (TOTP via otplib) — enable per user
- RBAC on every route (`@Roles(...)`), deny-by-default
- Row-level scoping — RMs only see their own investor book; managers/admins see all
- AES-256-GCM field encryption for PAN and mobile numbers (never stored plaintext)
- Global rate limiting (100 req/min) + strict 5/min on login
- All errors sanitized before reaching the client — no stack traces, no DB errors leaked
- Helmet security headers, strict CORS allowlist
- Full audit log table (who did what, when, from which IP)
- Graceful shutdown (SIGTERM/SIGINT) — required for zero-downtime Railway redeploys
- `/api/v1/health` checks DB connectivity, not just process liveness

## Local setup

```bash
cd sangam
docker-compose up -d          # postgres + redis

cd backend
cp .env.example .env
# fill in DATABASE_URL=postgresql://sangam:sangam@localhost:5432/sangam
# generate secrets:
openssl rand -base64 48   # -> JWT_ACCESS_SECRET
openssl rand -base64 48   # -> JWT_REFRESH_SECRET
openssl rand -base64 32   # -> FIELD_ENCRYPTION_KEY
npm install
npx prisma migrate dev --name init
npm run start:dev             # http://localhost:3001/api/v1/health

cd ../frontend
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev                    # http://localhost:3000
```

Create your first user directly via Prisma Studio (`npx prisma studio` in `backend/`) since
there's no public signup route by design — SANGAM is invite-only, admin-provisioned.

## Deploying to Railway

### 1. Create the project
- railway.app → New Project → **Empty Project**
- Add a **PostgreSQL** plugin (Railway → New → Database → PostgreSQL)
- Add a **Redis** plugin (New → Database → Redis) — needed once BullMQ/queues come in Phase 5

### 2. Push this repo to GitHub
```bash
cd sangam
git init
git add .
git commit -m "SANGAM Phase 1 foundation"
git branch -M main
git remote add origin https://github.com/<you>/sangam.git
git push -u origin main
```

### 3. Backend service
- Railway → New → **GitHub Repo** → select the repo → set **Root Directory** to `backend`
- Railway auto-detects the `Dockerfile`
- Variables tab, add:
  | Key | Value |
  |---|---|
  | `DATABASE_URL` | Reference: `${{ Postgres.DATABASE_URL }}` |
  | `REDIS_URL` | Reference: `${{ Redis.REDIS_URL }}` |
  | `JWT_ACCESS_SECRET` | output of `openssl rand -base64 48` |
  | `JWT_REFRESH_SECRET` | output of `openssl rand -base64 48` |
  | `FIELD_ENCRYPTION_KEY` | output of `openssl rand -base64 32` |
  | `CORS_ORIGIN` | your frontend's Railway URL (add after step 4) |
  | `PORT` | `3001` |
- Settings → Healthcheck Path: `/api/v1/health` (already set in `railway.json`)
- Deploy. First deploy runs `prisma migrate deploy` automatically via the Dockerfile CMD.

### 4. Frontend service
- Railway → New → **GitHub Repo** → same repo → Root Directory `frontend`
- Variables: `NEXT_PUBLIC_API_URL` = `https://<backend-service>.up.railway.app/api/v1`
- Deploy. Copy this service's public URL back into the backend's `CORS_ORIGIN` and redeploy backend.

### 5. Custom domain (optional)
- Each service → Settings → Networking → Custom Domain → point your DNS CNAME at the Railway target.

### 6. Verify
- `https://<backend>.up.railway.app/api/v1/health` → `{"status":"ok"}`
- `https://<frontend>.up.railway.app` → login page loads
- Create a user via Prisma Studio (run locally against the production `DATABASE_URL`, or a temporary internal admin endpoint you remove after first use) and log in.

## Importing your Excel files

A working upload flow is now built in — not a manual daily task, just:

1. Log in, go to `/import`
2. Upload **Investor List** first (creates/updates investors, encrypts PAN + mobile on the way in)
3. Upload **Live Folio Report** second (links folios to investors by name)

Only `SUPER_ADMIN`, `ADMIN`, `OPERATIONS` roles can import. Every import is logged in `AuditLog`
with row counts. Re-uploading the Investor List updates existing rows by UCC (no duplicates).
Re-uploading the Folio Report skips folios that already exist.

This is not automatic/daily — you upload whenever you have a fresh export from your source
system. If you want it to run every day without clicking anything, that needs a scheduled
job (Phase 5, BullMQ) pulling from wherever these exports originate — tell me the source and I'll wire it up.

## Production checklist before onboarding real client data

- [ ] Rotate all secrets generated above — don't reuse local dev values
- [ ] `CORS_ORIGIN` locked to the exact frontend domain, no wildcards
- [ ] Enable 2FA for every admin-level user before go-live
- [ ] Turn on Railway's automated Postgres backups
- [ ] Review `AuditLog` retention — decide how long logs are kept
- [ ] PAN/mobile fields go through `FieldEncryptionService` — never insert raw client PII outside that path
- [ ] The two Excel files you uploaded (investor list, folio report) contain real PAN numbers and phone numbers — don't commit them to git. Import them via a script that reads local files and writes through the encrypted `Investor`/`Folio` models; I can build that import script next if you want it.

## What's next (per your roadmap)

Phase 1 (this scaffold) → Phase 2 CRM (Client 360, Tasks, Meetings, Pipeline) → Phase 3
Portfolio Intelligence (folio ingestion, XIRR, health score) → Phase 4 AI (Copilot, Morning
Briefing) → Phase 5 Automation (BullMQ workflows) → Phase 6 multi-tenancy.

Tell me which module to build next and I'll extend this same repo.

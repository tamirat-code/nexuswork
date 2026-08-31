# Deployment

Deployment runbooks and environment setup notes.

- [Production-readiness runbook](./production-readiness.md) — the canonical
  gate-status document; don't duplicate its content elsewhere.

## Local / development

```bash
docker compose up --build
```

Brings up four services (see `docker-compose.yml`):

| Service | Image/build | Port | Role |
| --- | --- | --- | --- |
| `mongo` | `mongo:7` | 27017 | Single-node replica set (`rs0`) — required because the app uses Mongo transactions (ledger writes, milestone state changes) |
| `mongo-init` | `mongo:7` | — | One-shot: initiates the replica set if not already initiated, then exits |
| `backend` | `./apps/backend/Dockerfile` | 5000 | API + Socket.IO + jobs; waits for `mongo-init` to complete successfully |
| `frontend` | `./apps/frontend/Dockerfile` | 5173 → 80 | Built Vite SPA served by nginx (`infrastructure/nginx/nginx.conf`) |

Backend environment comes from `apps/backend/.env` (copy from `.env.example`
and fill in secrets — Stripe/Chapa keys, JWT secret, Google OAuth client ID,
Resend API key, S3 credentials, credential-issuer signing key, etc.; see
`config/env.js` for the full list and `config/env.validation.js` for which
are required to boot). Frontend environment comes from `apps/frontend/.env`.

Without Docker: run `mongod` yourself as a single-node replica set, then in
two terminals:

```bash
cd apps/backend && npm install && npm run dev
cd apps/frontend && npm install && npm run dev
```

## Production

`docker-compose.prod.yml` builds the same two application images with
production-oriented settings (see that file and
`infrastructure/docker/README.md` for image-build specifics). CI
(`.github/workflows/ci.yml`) runs the test suite on every push; it does not
currently deploy — promotion to a live environment is a manual/external step.

Before promoting a build, walk the
[production-readiness runbook](./production-readiness.md) — it tracks the
UAT, performance, and security evidence gates explicitly rather than
asserting the system is "production ready" without evidence.

## Database bootstrap

- `infrastructure/scripts/reset-db.sh` — drops and reinitializes the local
  database for a clean dev environment.
- `apps/backend/src/seed/index.js` (`npm run seed`) — seeds categories,
  skills, demo projects, and demo users (see `src/seed/*.seed.js`).
- `apps/backend/src/config/database.indexes.js` — the canonical index list,
  applied on connection; see [`database/README.md`](../database/README.md#indexing).

## Migrations

Two explicit, dry-run-first migration scripts exist (both require
`MIGRATION_APPROVED=true` to actually apply, not just report):

```bash
npm run ledger:migration:dry-run     # backfill amount_minor from legacy amount fields
npm run ledger:migration:apply

npm run project-skills:migration:dry-run   # backfill Project.required_skill_ids from required_skills labels
npm run project-skills:migration:apply
```

See [`architecture/phase-1-payment-boundary.md`](../architecture/phase-1-payment-boundary.md)
for why the minor-unit migration is deliberately non-destructive and
dry-run-gated.

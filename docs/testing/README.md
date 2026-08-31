# Testing

## What exists

- **Backend**: Jest (`NODE_OPTIONS=--experimental-vm-modules jest --runInBand`,
  run via `npm test` in `apps/backend`). **31 integration test files**
  (`tests/integration/`, one per module — auth, admin, categories, clients,
  contracts, disputes, files, financial ledger, health, invoices, learning,
  meetings, milestones, payments, portfolios, proposals, recommendation,
  resource authorization, reviews, search, security-resources, skills,
  students, submissions, verifications, wallets, webhooks, analytics,
  audit-events/logs) plus **12 unit test files**
  (`tests/unit/` — commission, money, payment-provider, payment-state, chapa
  provider, credential export, env validation, file content, request context,
  s3 client, session versioning, university-analytics-privacy). Test
  fixtures/helpers live in `tests/helpers/` (`db.js`, `fixtures.js`,
  `stripeMock.js`).
- **Frontend**: a Playwright smoke test (`apps/frontend/e2e/tests/smoke.spec.js`)
  plus a locale-completeness check (`apps/frontend/tests/i18n-locales.test.mjs`)
  verifying every key in `en.json` has a matching key in `am.json`/`af.json`.
- **CI**: `.github/workflows/ci.yml` runs the backend syntax check
  (`npm run syntax` — `node --check` over every source/test file) and the
  Jest suite on every push/PR.

## Test strategy by area

| Area | Approach |
| --- | --- |
| Authorization | `resource-authorization.test.js` + `security-resources.test.js` exercise the matrix in [`security/phase-0-authorization-matrix.md`](../security/phase-0-authorization-matrix.md) — every protected resource against anonymous/wrong-role/wrong-owner requests |
| Payments | `payments.test.js`, `payment-provider.test.js`, `payment-state.test.js`, `chapa.provider.test.js`, `stripeMock.js` — provider calls are mocked/doubled, not hit against live Stripe/Chapa |
| Financial ledger | `financial-ledger.test.js` — asserts journal entries balance and mutation attempts are rejected |
| Webhooks | `webhooks.test.js` — signature verification and idempotent replay handling |
| Money precision | `money.test.js`, `commission.test.js` — minor-unit arithmetic and commission/waiver calculation |
| Credentials | `credential-export.test.js` — signed Open Badges/VC document shape and signature verification |
| Privacy | `university-analytics-privacy.test.js` — confirms university analytics responses are aggregated, not individually identifying |
| i18n | `i18n-locales.test.mjs` — no missing translation keys |

## Running tests locally

```bash
# Backend
cd apps/backend
npm install
npm test                 # full Jest suite
npm run syntax           # fast syntax-only check across all source files

# Frontend
cd apps/frontend
npm install
npx playwright test      # e2e smoke test (needs the dev server running)
node tests/i18n-locales.test.mjs
```

Integration tests need a MongoDB instance (`tests/helpers/db.js` connects to
`MONGO_URI` or spins up an in-memory instance, depending on environment —
check that file for the current strategy before assuming either).

## Gaps / not yet covered

- No load/performance test suite is checked into the repo. Performance
  targets and evidence status are tracked in
  [`deployment/production-readiness.md`](../deployment/production-readiness.md),
  not here.
- No dedicated frontend component/unit test suite beyond the e2e smoke test
  — component-level testing (React Testing Library, etc.) is not set up.
- Chapa integration tests run against deterministic HTTP doubles, not a live
  sandbox (see [`architecture/phase-3-ethiopian-psp.md`](../architecture/phase-3-ethiopian-psp.md)
  — sandbox/live verification is explicitly flagged as not done).

The production/UAT/performance evidence gates are documented in
[the production-readiness runbook](../deployment/production-readiness.md).

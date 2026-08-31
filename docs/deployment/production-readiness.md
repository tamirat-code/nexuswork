# NexusWork production-readiness runbook

This runbook is the release gate for the remaining operational checks. Local
tests and provider doubles are not evidence of real-provider settlement,
production backup recovery, or end-to-end UAT.

## Evidence status

| Gate | Current status | Required evidence |
| --- | --- | --- |
| Backend regression | Verified locally by the project owner: 37 suites / 213 tests | CI run with the same commit |
| Frontend build | Verified locally | CI build artifact |
| Syntax and diff checks | Verified locally | CI logs |
| MongoDB replica set | Verified locally with `rs.status().ok = 1` | Production replica-set health output |
| Dependency audit | Configured in CI, not locally verified when the registry is unavailable | Successful `npm audit --audit-level=high` in CI |
| Stripe sandbox settlement | Not verified by this local run | Successful test payment, payout, webhook, and reconciliation evidence |
| Chapa sandbox settlement | Not verified by this local run | Successful ETB checkout, callback/webhook, status query, payout, and reconciliation evidence |
| Backup and restore | Not verified | A dated backup restored into an isolated database and application smoke test |
| Performance | Not verified | Load-test report against an environment representative of production |
| UAT | Not verified | Signed checklist from client, student, university, and admin flows |

## Local regression gate

Run from the repository root with the dedicated test database:

```bash
NODE_ENV=test MONGO_URI=mongodb://localhost:27017/nexuswork_test \
  npm test --workspace=apps/backend
npm run build:frontend
git diff --check
```

The test database must contain `test` in its name. The backend test setup also
rewrites an unsafe non-test database name to `nexuswork_test`.

## MongoDB backup and restore drill

Use a dedicated backup location with restricted permissions. Do not place
database dumps in the repository.

```bash
mkdir -p ./var/backups
chmod 700 ./var/backups
mongodump --uri="$MONGO_URI" --archive="./var/backups/nexuswork-$(date -u +%Y%m%dT%H%M%SZ).archive.gz" --gzip
```

Restore into an isolated database, never over the live database:

```bash
mongorestore --uri="$RESTORE_MONGO_URI" --nsFrom='nexuswork.*' \
  --nsTo='nexuswork_restore_drill.*' --drop --gzip \
  --archive="./var/backups/<backup-file>.archive.gz"
```

The drill is successful only after checking collection counts, a health/readiness
request, authentication, a representative contract read, and a payment/ledger
read in the restored environment. Record backup timestamp, source URI class,
restore URI class, operator, and result; never record credentials.

## Provider verification gates

### Stripe

In a non-production environment, execute one complete flow for each relevant
currency/provider path:

1. Create and confirm a payment intent.
2. Deliver the signed webhook more than once and confirm idempotent handling.
3. Approve a milestone and verify release accounting is not finalized before
   the provider status is definitive.
4. Verify a pending payout remains pending, then deliver a definitive paid
   status and verify the wallet/ledger projection once.
5. Deliver a failed/reversed status and verify the payout is not shown as paid.

### Chapa

With Chapa sandbox credentials and ETB data:

1. Initialize checkout with a unique `tx_ref` no longer than the provider limit.
2. Complete the sandbox payment and record the provider reference.
3. Confirm the callback is treated only as a trigger for server-side status
   verification.
4. Verify amount, currency, transaction reference, and status server-side.
5. Replay the webhook/callback and confirm no duplicate funding or release.
6. Execute the refund test path using a known `tx_ref`; verify initiated,
   processing, refunded, and reversed outcomes through the refund status API.
7. Execute the payout test path if enabled by the Chapa account and verify
   pending, paid, failed, and reconciliation outcomes.

No test or live provider credential belongs in source control, browser code,
logs, screenshots, or this document.

## UAT checklist

- Student: register, verify university identity, submit proposal, sign contract,
  fund-aware milestone visibility, start work, submit deliverable, view release,
  configure payout destination, and view wallet/payout state.
- Client: post project, review proposal, sign contract, fund with each enabled
  provider, review submission, approve/reject, grant portfolio consent, and
  see definitive payout/release state.
- University: review student verification and view analytics with fewer than
  and at least the configured privacy cohort threshold.
- Admin: review audit records, provider failures, disputes, and operational
  health without seeing secrets.
- Security: verify anonymous access, wrong-role access, cross-user resource
  access, private files, and denied portfolio consent.

## Performance gate

Run load tests against a staging deployment, not a developer laptop or the
production database. Measure p50/p95/p99 latency, error rate, throughput, DB
connections, CPU, memory, and queue/socket behavior for health, read-heavy
marketplace pages, authenticated contract reads, file metadata reads, and
payment initiation. Define pass thresholds before running the test and retain
the report with the release artifacts.

## Release decision

The release manager may mark these gates complete only when the evidence above
is attached to the release. Passing Jest tests alone does not certify provider
settlement, backup recovery, performance, or production readiness.

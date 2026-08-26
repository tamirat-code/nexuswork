# Phase 2 Financial Ledger

## Authority

`FinancialJournal` is the authoritative history for financial events posted by Phase 2 integrations. A journal is a balanced double-entry document containing immutable debit and credit entries. Payment, milestone, withdrawal, and wallet documents remain operational projections and compatibility records.

## Chart of accounts

The implemented account definitions are:

- `provider_clearing` — asset
- `escrow_liability` — liability
- `student_payable` — liability, per student and currency
- `platform_revenue` — revenue
- `payout_clearing` — liability
- `payment_processing_fee` — expense
- `refund_clearing` — asset
- `adjustments` — equity

Accounts are currency-scoped. Student payable accounts are also owner-scoped.

## Posting rules

- Successful funding: debit provider clearing; credit escrow liability.
- Successful milestone release: debit escrow liability; credit student payable and platform revenue.
- Successful refund: debit escrow liability; credit provider clearing.
- Withdrawal reservation: debit student payable; credit payout clearing.
- Failed withdrawal: append a reversal journal.

The centralized posting service rejects missing currencies, mixed currencies, negative/non-integer minor units, debit/credit entries with both sides populated, zero entries, and unbalanced journals.

## Immutability and corrections

Financial journals are append-only. Model update/delete operations are rejected. Corrections use a new reversal journal with debits and credits swapped; the original journal is never modified.

## Idempotency and audit

Every posted journal has a unique `idempotency_key`, `transaction_id`, source resource, request ID, actor metadata, and optional provider event ID. Duplicate posting attempts return the existing journal. Provider webhook replay remains guarded by the existing `WebhookEvent` unique event ID.

## Transactions and deployment

Each journal is persisted as one MongoDB document, so the balanced journal itself is atomic on standalone MongoDB. Operational projection updates and journal posting are currently sequential and must be deployed on a MongoDB replica set before being upgraded to multi-document transactions. Phase 2 does not claim transaction guarantees for those cross-document updates.

## Historical data

No historical records are rewritten. `npm run ledger:migration:dry-run --workspace=apps/backend` produces a read-only report of missing, invalid, and mismatched minor-unit fields. Migration requires a later approval checkpoint and discrepancy-free report.

## Scope exclusions

Escrow orchestration, payout engine, reconciliation, pricing/commission engine, and Ethiopian payment providers remain later-phase work.

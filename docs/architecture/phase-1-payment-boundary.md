# Phase 1 Payment Provider and Money Boundary

## Scope

Phase 1 establishes a provider-neutral payment capability boundary and canonical integer minor-unit values. It does not introduce a ledger, escrow, payout engine, reconciliation engine, commission engine, or new PSP.

## Provider boundary

Business services use `modules/payments/providers/index.js`. The active Stripe implementation is isolated in `stripe.provider.js`; only that adapter imports `stripe.client.js` or consumes Stripe SDK object shapes.

Normalized capabilities include payment intents, transfers, refunds, connected accounts, account links, connected balances, payouts, and webhook verification. Provider statuses are normalized to `pending`, `succeeded`, and `failed`; provider failures are represented as `PaymentProviderError`.

## Money boundary

The canonical shape is:

```js
{ amountMinor: 1250, currency: "usd" }
```

New payment-domain writes store `amount_minor` alongside the legacy major-unit `amount` field. Existing fields and API responses remain compatible. Records without `amount_minor` use the explicit `moneyFromLegacyMajorUnits()` compatibility path; no records are rewritten automatically.

## Data migration strategy

No destructive migration is part of Phase 1. A later migration must:

1. inventory records missing or disagreeing on `amount_minor`;
2. validate currency and decimal precision per currency;
3. generate an auditable dry-run report;
4. backfill only after approval;
5. retain legacy fields until all consumers and reports are migrated.

The immutable ledger remains a later phase.


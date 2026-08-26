# Phase 3 — Ethiopian PSP and ETB payment boundary

## Evidence status

The Chapa adapter is implemented and contract-tested with deterministic HTTP
doubles. No Chapa sandbox or live credentials were available in this worktree,
so sandbox and live verification are **NOT VERIFIED**.

Official documentation reviewed:

- [Accept payments](https://developer.chapa.co/integrations/accept-payments)
- [Verify payments](https://developer.chapa.co/integrations/verify-payments)
- [Webhooks](https://developer.chapa.co/integrations/webhooks)

## Provider selection and capability matrix

Chapa is the selected Phase 3 provider because its official documentation
confirms ETB hosted checkout initialization, verification by `tx_ref`, callback
references, and HMAC webhook signatures.

| Capability | Chapa | Evidence / status |
| --- | --- | --- |
| Hosted ETB checkout | Supported | Implemented and mock contract-tested |
| Transaction status lookup | Supported | Implemented and mock contract-tested |
| Callback/webhook notification | Supported | Signature boundary implemented; sandbox not verified |
| Refunds | Unsupported in this adapter | Never reports fake success |
| NexusWork payout orchestration | Deferred | Phase 4 boundary |
| Stripe Connect compatibility | Not a Chapa capability | Existing Stripe path preserved |

## Lifecycle

1. NexusWork creates an idempotent internal payment operation.
2. The Chapa adapter initializes a hosted checkout with integer minor-unit ETB
   converted only at the provider boundary.
3. The provider `tx_ref` and provider reference are stored additively.
4. Callback/webhook input is treated as a notification, not financial truth.
5. The adapter re-queries Chapa and verifies transaction, amount, currency, and
   milestone metadata before `confirmFunding` can mark the milestone funded.
6. Phase 2 ledger posting remains the authoritative financial effect and is
   idempotent by payment event key.

## Security and recovery

- Chapa credentials and webhook secret are server-only centralized config.
- Chapa webhooks use HMAC verification and duplicate event IDs are rejected by
  the existing unique `WebhookEvent` constraint.
- Callback success is never trusted without provider status lookup.
- Amount and currency mismatches are rejected.
- Provider timeout/failure is normalized; it is not converted to success.
- Provider-confirmed/database-failed cases remain recoverable through the stored
  provider reference and status lookup. Full reconciliation is deferred.

## Data and compatibility

Payment records retain all Stripe fields and add `provider`,
`provider_payment_id`, `provider_reference`, `provider_event_id`, and
`ledger_journal_id` with indexes. No destructive migration is performed.
Existing Stripe initiation, webhooks, refunds, transfers, withdrawals, and
Connect behavior remain on their existing path.

## Explicit limitations

This phase does not implement escrow, payout orchestration, settlement
reconciliation, payout retry state machines, or a commission engine. Chapa
refund and payout support are not claimed. Real provider verification remains
pending credentials and sandbox access.

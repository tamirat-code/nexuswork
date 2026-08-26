# Phase 0 Financial Boundary Inventory

This inventory deliberately records the current model rather than introducing a ledger or changing financial schemas.

| Field | Type | Unit/currency | Storage | Read/write locations | Floating-point risk | Downstream dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| Payment.amount | MongoDB `Number` | Major currency units; `currency` defaults to USD | `modules/payments/payments.model.js` | Payment service creation, Stripe amount conversion, webhooks, milestone release/refund | Yes; converted with rounding at Stripe boundary | Stripe PaymentIntent, transfer/refund, audit metadata, invoices |
| Wallet balance | Derived aggregation, not a stored balance field | Major units, payment currency | `Payment` aggregation in `wallets.service.js` | Wallet reads, withdrawal availability checks | Yes; uses numeric aggregation and epsilon comparisons | Withdrawals, Stripe Connect balance |
| Milestone.amount | MongoDB `Number` | Major currency units; milestone has no currency field | `modules/milestones/milestones.model.js` | Milestone creation, funding, payout/commission calculation | Yes; commission uses multiplication/subtraction | Contract totals, Payment, Invoice, Stripe |
| Invoice.amount | MongoDB `Number` | Major units; `currency` defaults to USD | `modules/invoices/invoices.model.js` | Invoice creation/read/download/status | Yes; line-item totals are numeric | Contract, milestone, payment metadata/PDF |
| Invoice line_items.unit_price | MongoDB `Number` | Major units | Embedded invoice document | Invoice creation and rendering | Yes; quantity × unit price arithmetic | Invoice total and PDF |
| Withdrawal.amount | MongoDB `Number` | Major units; `currency` defaults to USD | `modules/wallets/withdrawal.model.js` | Withdrawal request, balance checks, Stripe payout, webhooks | Yes; multiplied by 100 for Stripe | Wallet aggregation, Stripe payout, idempotency |
| Commission | Derived `Number` | Major units | Payment record with `direction=commission` | `milestones.service.js` from `amount * (1 - commissionRate)` | High; fee and payout can diverge by fractional cents | Payment, student payout, reporting |
| Refund | Payment `Number` plus Stripe refund reference | Major units in local record; Stripe uses minor units | `Payment` record with `direction=refund` | Payment service and webhook reconciliation | Yes; local/Stripe conversion boundary | Milestone status, Stripe refund, audit |

Phase 0 consequence: these fields require a controlled minor-unit migration and compatibility plan before financial hardening. The ledger, escrow, payout engine, commission engine, and provider abstraction are intentionally deferred.


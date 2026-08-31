# Administrator guide

Admin accounts are provisioned directly (not self-registered through the
public sign-up form) and have access to `/admin/*` plus every admin-only API
route under `/v1/admin` and `/v1/audit-logs`.

## 1. Dashboard

`/admin` (and `/admin/analytics`) surfaces platform-wide metrics: user
counts by role, project/contract/milestone volume, payment volume, and
open-dispute count.

## 2. User management

At `/admin/users`:
- **Search/filter** users by role, status, or email.
- **Suspend** or **restore** an account — a suspended user can't log in until
  restored; both actions require a reason, which is written to `AuditLog`.
- **Delete** a user (also reason-required and audited) — use with care; this
  does not cascade-delete their contracts/payments history, which remains
  for record-keeping.
- **Change a user's role** — logged the same way.
- **Client and student organization/identity verification** review queues
  are also reachable from here for cases that need admin (not just
  university-staff) attention — e.g. client organization verification.

## 3. Dispute resolution

At `/admin/disputes`: the open-dispute queue across the whole platform (not
just one university). Each dispute shows the milestone, the reason, who
opened it, and the milestone's status snapshot from before the dispute
opened. Resolving a dispute records a resolution summary and an outcome, and
the milestone proceeds from there (funds may be released, refunded, or the
milestone reset, depending on the outcome you choose).

## 4. Catalog management

Categories, skills, and learning resources are admin-managed catalogs
(`/skills`, `/learning` in the shared nav; create/edit/delete requires the
admin role even though browsing is public). Category and skill entries also
carry the **proposal price floor** used to enforce FR-23 (no systematic
underpricing) — set these per category, and per experience level for skills.

## 5. Audit log

Every sensitive action platform-wide — user suspensions, role changes,
dispute resolutions, payment state changes, verification decisions, contract
lifecycle events, and more (~65 tracked action types) — is written to an
**append-only** audit log. It cannot be edited or deleted, only flagged for
review. Use the audit log to trace exactly what happened to a specific
entity (`GET /v1/audit-logs/history/:entity_type/:entity_id`) or to review a
flagged entry.

## 6. What's intentionally not here

There's no bulk data-export or direct-database-edit tool in the admin UI —
by design, every state change goes through the same audited service-layer
logic the rest of the platform uses, so there's no "adjust a balance
directly" shortcut that would bypass the ledger.

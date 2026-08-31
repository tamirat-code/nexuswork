# Requirements

Functional and non-functional requirements for NexusWork, as defined in the
project proposal (`Nexuswork — freelance platform for students`, Chapter 3),
cross-checked here against what `apps/backend` and `apps/frontend` actually
implement. Full acceptance-criteria detail for each FR lives in the proposal
document (kept alongside this repo, not duplicated here) — this table is the
living status tracker.

**Status legend**: ✅ Implemented · 🟡 Partial · ⚠️ Divergent from proposal ·
❌ Not implemented.

## Stakeholders

| Stakeholder | Interest |
| --- | --- |
| Student freelancer | Access to relevant paid work, fair payment, portfolio growth |
| Client | Vetted, cost-effective student talent; on-time, on-spec delivery |
| University | Visibility into employment/skill outcomes; institutional reputation |
| Platform administrator | Platform integrity, dispute resolution, sustainable commission revenue |

## User types (implemented)

`visitor` (unauthenticated), `student`, `client`, `university_staff`, `admin` —
matches `User.role` in `apps/backend/src/shared/enums/roles.enum.js` exactly.
The proposal's "Moderator/Support" sub-role under Administrator is **not** a
distinct role in the data model today (`AuditLog.actor_role` has a
`moderator` enum value and `AuditReview.reviewer_role` accepts
`admin`/`moderator`, but no registration path creates a moderator account —
🟡 partial).

## Functional requirements

| ID | Requirement (summary) | Status | Where |
| --- | --- | --- | --- |
| FR-01 | University-verified registration (institutional email or student ID + enrolment year; Google OAuth as an alternate sign-in, not a bypass) | 🟡 | `auth.service.js` registration accepts any email plus a separate `Verification` submission flow (`verifications.routes.js`); registration itself doesn't require an institutional-domain email — verification is a distinct post-registration step, not a registration gate |
| FR-02 | University staff review/approve/reject student verification, with staff accounts themselves gated by admin-approved verification | ✅ | `verifications.controller.js` (`review`), `staff-verifications.*` (staff's own gating) |
| FR-03 | Skill registration with self-report vs. assessment-verified distinction, linkable to a course | ✅ | `StudentProfile.skills[].verification_method`, `course_name`/`course_code`/`course_completed_at`, `SkillCertificationRequest` |
| FR-04 | Clients register and post projects (description, skills, budget, deadline) | ✅ | `projects.routes.js`, `Project` model |
| FR-05 | Students browse/search projects and submit proposals (price, delivery time, cover note) | ✅ | `proposals.routes.js`, `Proposal` model |
| FR-06 | Clients review proposals and accept one to form a contract | ✅ | `proposals.controller.js` (`accept`) → `Contract` creation |
| FR-07 | Contracts define milestones with amounts and due dates | ✅ | `milestones.routes.js`, `Milestone.amount`/`due_date`/`sequence` |
| FR-08 | Clients fund milestones via escrow before work begins | ✅ | `POST /v1/milestones/:id/fund`, `Milestone.status` gate (`funded` required before `start`) |
| FR-09 | Students submit work; clients approve/request revision/dispute | ✅ | `submissions.routes.js`, `disputes.routes.js` |
| FR-10 | Approved milestone releases via payout through the provider abstraction; wallet is onboarding/history only, no held balance | ✅ | `payments/providers/` adapter (Stripe + Chapa), `Wallet` has no balance field — balance is derived (see [database docs](../database/schema.md#wallet-walletsmodeljs)) |
| FR-11 | Both parties rate/review after contract completion | ✅ | `reviews.routes.js`, unique per `(contract_id, reviewer_id)` |
| FR-12 | AI recommendation: projects → students, students → clients | ✅ | `recommendation.routes.js` (`/me`, `/project/:id/students`); default model is a skill-overlap heuristic (`model_name: "skill-overlap"`), with an AI-provider hook (`config/ai.config.js`) for a stronger model |
| FR-13 | Portfolio maintained by students; approved milestones addable | ✅ | `portfolios.routes.js` (`postFromMilestone`) |
| FR-14 | Dispute escalation for admin review | ✅ | `disputes.routes.js`, `admin.routes.js` (`/disputes/:id/resolve`) |
| FR-15 | Admin manages users, disputes, categories, platform reporting | ✅ | `admin.routes.js`, `categories.routes.js`, `analytics.routes.js` (`/platform`) |
| FR-16 | University staff view aggregate/anonymized employment & skill analytics | ✅ | `analytics.routes.js` (`/university/mine`, `/university/:id`) — anonymization approach documented in `tests/unit/university-analytics-privacy.test.js` |
| FR-17 | Messaging and file sharing scoped to an active contract | ✅ | `messaging.routes.js`, `files.routes.js` (`related_type` includes `message_attachment`, `contract`) |
| FR-18 | Invoices and payment history | ✅ | `invoices.routes.js`, `payments.routes.js` (`GET /`) |
| FR-19 | Skill credentials exportable as Open Badges 3.0 / W3C Verifiable Credentials | ✅ | `verifications.service.js` builds a document typed `["VerifiableCredential", "OpenBadgeCredential"]` with a full `@context`; signed in `credential-signing.js`, exported via `/v1/verifications/mine/:id/credential` (JSON) and `/credential/card` (PDF), publicly checkable via `/v1/verifications/credentials/:id/verify` and `/.well-known/nexuswork-issuer-key` |
| FR-20 | Verification tiers displayed distinctly (identity vs. coursework-linked vs. self-assessment) | ✅ | `StudentProfile.skills[].verification_method` enum (`self_declared`/`assessment`/`university_certified`) kept separate from `StudentProfile.verification_status` (identity) |
| FR-21 | Commission flat/decreasing for newer freelancers, waivable below a threshold | ✅ | `commission.service.js` — `COMMISSION_WAIVER_MILESTONE_THRESHOLD` env (default 3 completed milestones), flat `COMMISSION_RATE` otherwise (no escalating tiers implemented — proposal only specifies "flat or decreasing", which this satisfies) |
| FR-22 | No paid bidding credits, no monthly proposal cap for verified students | ✅ | No credit/cap field exists anywhere in `Proposal`, `StudentProfile`, or the proposal-creation validators |
| FR-23 | Proposal pricing bounded by category/skill-level floor | ✅ | `Category.proposal_price_floor_minor`, `Skill.proposal_price_floor_minor_by_level`, enforced in `proposals.service.js` at submission |
| FR-24 | Payments abstracted behind an internal provider interface; Ethiopian PSP for ETB, Stripe retained for international USD | ✅ | `modules/payments/providers/` (`payment-provider.js` interface, `stripe.provider.js`, `chapa.provider.js`) — see [Phase 1](../architecture/phase-1-payment-boundary.md) and [Phase 3](../architecture/phase-3-ethiopian-psp.md) |
| FR-25 | Escrow held only through a licensed, NBE-compliant PSP for the transaction's currency/jurisdiction | ⚠️ | Chapa integration is implemented and contract-tested against Chapa's published API, but **sandbox/live verification was not performed** in this environment (explicitly flagged as NOT VERIFIED in [Phase 3](../architecture/phase-3-ethiopian-psp.md)) — compliance claim can't be signed off from code alone |
| FR-26 | University staff view skill-demand analytics (client demand vs. verified student supply) | ✅ | `analytics.controller.js` `getMyUniversity`/`getUniversity` |
| FR-27 | Portfolio entries auto-generated from approved milestones, subject to per-entry client consent | ✅ | `PortfolioItem.consent_status`/`consented_by`/`consented_at`, `PATCH /v1/portfolios/:id/consent` |
| FR-28 | Reputation record structured for future portable-credential export | 🟡 | `Review` + verification credentials exist and are individually exportable (FR-19); there is no single combined "reputation credential" export endpoint bundling ratings + delivery metrics + verified credentials into one document yet |

## Non-functional requirements

Drawn from proposal §3.7–3.13, matched against the implementation:

| Requirement | Status | Evidence |
| --- | --- | --- |
| Security: password hashing, MFA, rate limiting, RBAC | ✅ | `bcryptjs` hashing, TOTP MFA (`mfa.utils.js`), `rateLimiter.middleware.js`, `role.middleware.js` |
| Security: audit trail for sensitive actions | ✅ | Append-only `AuditLog` (~65 tracked action types) |
| Security: endpoint-level authorization matrix | 🟡 | Documented and largely covered by tests — see [`security/phase-0-authorization-matrix.md`](../security/phase-0-authorization-matrix.md) for exact coverage status |
| Data privacy: anonymized university analytics | ✅ | `tests/unit/university-analytics-privacy.test.js` |
| Reliability: idempotent payment/webhook handling | ✅ | `WebhookEvent` dedup, partial-unique `Payment` indexes, `idempotency_key` on `Withdrawal` and ledger journals |
| Reliability: append-only financial ledger | ✅ | `FinancialJournal`/`FinancialAccount` reject mutation at the schema level |
| Internationalization | ✅ | i18next with `en`/`am`/`af`, see [`meetings-and-i18n.md`](../meetings-and-i18n.md) |
| Realtime UX (chat, notifications, meetings) | ✅ | Socket.IO namespaces, see [`architecture/README.md`](../architecture/README.md) |
| Deployment: containerized, reproducible environment | ✅ | `docker-compose.yml`/`docker-compose.prod.yml`, CI pipeline |
| Production readiness gates (UAT, performance, security evidence) | 🟡 | Tracked explicitly in [`deployment/production-readiness.md`](../deployment/production-readiness.md) — see that doc for current gate status rather than duplicating it here |

## Known gaps and honest caveats

- **FR-01**: registration does not currently *require* an institutional email
  domain or student ID at signup — any email can register, and verification
  (FR-02) is a separate, optional-until-needed step gating proposal
  submission and search visibility, not registration itself. If the proposal
  intends a hard registration gate, that's a product decision still open.
- **FR-25 / Chapa compliance**: the Chapa payment path is real, tested code
  behind the same provider interface as Stripe, but this repository has no
  record of a completed NBE-licensing/compliance review — that's an
  organizational, not code, artifact and belongs in `deployment/` or an
  external compliance doc if/when it exists.
- **FR-28**: no single "portable reputation credential" endpoint exists yet;
  each verifiable credential (FR-19) is exported individually.
- **Moderator role**: referenced in enums (`AuditLog.actor_role`,
  `AuditReview.reviewer_role`) but has no registration/promotion path in the
  current `admin` module — effectively unused today.

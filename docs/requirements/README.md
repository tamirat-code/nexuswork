# Requirements

Functional and non-functional requirements for NexusWork, as defined in the
project proposal (`Nexuswork — freelance platform for students`, Chapter 3),
cross-checked here against what `apps/backend` and `apps/frontend` actually
implement. Full acceptance-criteria detail for each FR lives in the proposal
document (kept alongside this repo, not duplicated here) — this table is the
living status tracker.

**Status legend**: ✅ Implemented · 🟡 Partial · ⚠️ Divergent from proposal ·
🧭 Designed · ❌ Future/not implemented.

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

## Enterprise API / Talent Hub (FR-29–FR-35)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-29 | Enterprise partner registration and individually revocable API credentials | 🟡 | `api-partners` provisions separate `ApiPartner`/`ApiKey` records, hashes one-time keys, exposes `/partner/v1`, supports individual revocation, and lets an authenticated partner issue/revoke its own keys; self-service partner registration remains future |
| FR-30 | Sandbox/Growth/Enterprise tiers with rate limits and monthly quotas | ✅ | Mongo-backed per-minute/month counters enforce tier limits with `429`/`Retry-After`; `/partner/v1/me`, `/me/usage`, and the partner portal expose current usage and remaining quota |
| FR-31 | Separate student consent for Talent API discovery and field-level exposure | 🟡 | Student Talent API consent is disabled by default and managed through `/v1/students/me/talent-api-consent`; `/partner/v1/talent/search` returns only verified, opted-in students and only consented fields |
| FR-32 | Partner webhook subscriptions with idempotency, retries, and failure logging | ✅ | `api-webhooks.service.js` stores encrypted secrets, queues idempotent deliveries, signs payloads, retries with leases/backoff, marks exhausted deliveries, and exposes delivery history |
| FR-33 | Audit every partner read/export of student data | 🟡 | Every Talent API search appends an immutable `partner_api_read` event with partner, endpoint, filters, fields returned, and result counts; admins can filter audit logs by `partner_id` |
| FR-34 | Partner self-service portal for keys, usage, and billing | ✅ | `/partner-portal` provides key rotation/revocation, usage, billing statements, webhook management, and delivery history; raw secrets are shown only once and held in browser memory |
| FR-35 | Usage-based partner billing independent of marketplace commission | 🟡 | `ApiBillingLedger` records partner API requests and calculates tier-priced usage independently; invoice status/history are exposed, while payment collection and settlement automation remain future |

## Project Oversight & Checkpoints (FR-36–FR-41)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-36 | Milestone task board with shared status history | ❌ | No `Task` model or task routes exist; milestone state is not a task board |
| FR-37 | Student milestone check-ins | ❌ | No `CheckIn` model or check-in routes exist |
| FR-38 | Configurable at-risk milestone detection | ❌ | No scheduled at-risk evaluator exists |
| FR-39 | At-risk notifications on transition and recovery | ❌ | Existing notifications are not connected to at-risk state transitions |
| FR-40 | Consolidated client oversight dashboard | ❌ | No cross-contract oversight dashboard exists |
| FR-41 | On-time delivery analytics | ❌ | Existing analytics does not expose the required student/category metric |

## Organization & Team Accounts (FR-42–FR-46)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-42 | Organization accounts with Admin, Recruiter, and Billing Viewer roles | ✅ | `organizations.*`, `org-membership.model.js`, and role checks implement organization membership |
| FR-43 | Admin invitation, removal, and role assignment | ✅ | Organization member routes and service methods implement invite, update, and remove |
| FR-44 | Recruiter-created projects/contracts owned by the organization | 🟡 | Organization membership exists, but project/contract ownership still uses individual user IDs |
| FR-45 | Billing Viewer payment/invoice access without project/proposal actions | 🟡 | Organization roles exist, but project, proposal, payment, and invoice authorization is not fully organization-scoped |
| FR-46 | Organization-scoped audit attribution and member filtering | 🟡 | Audit events retain the acting user; organization attribution/filtering is not complete across all org actions |

## Enterprise Compliance & Audit (FR-47–FR-50)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-47 | Organization SSO through SAML or OAuth/OIDC | ❌ | Current authentication supports email/password and Google sign-in, not organization SSO enforcement |
| FR-48 | Audit all client/org/API-partner reads or exports of student personal data | 🟡 | Audit infrastructure exists, but comprehensive sensitive-read coverage is not complete |
| FR-49 | Organization-admin audit reporting scoped by date and member | ❌ | No organization self-service audit reporting route exists |
| FR-50 | Documented data retention and deletion policy | ❌ | No implemented retention/deletion workflow or policy artifact exists |

## Bulk / Cohort Hiring (FR-51–FR-54)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-51 | Cohort program creation with seats, skills, and shared terms | ❌ | No `Cohort` model or routes exist |
| FR-52 | Multi-candidate cohort applications capped by seat count | ❌ | No cohort application workflow exists |
| FR-53 | Individual contract generation for accepted cohort candidates | ❌ | Existing contracts are proposal-based, not cohort-generated |
| FR-54 | Cohort progress dashboard | ❌ | No cohort rollup dashboard exists |

## Enterprise Billing & Invoicing (FR-55–FR-58)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-55 | Organization billing-mode selection | 🟡 | Organization billing mode is stored and editable, but it is not yet applied to all organization contracts |
| FR-56 | Escrow protection under consolidated billing | ❌ | Consolidated billing does not yet orchestrate milestone escrow and invoice timing |
| FR-57 | Consolidated invoices with contract/milestone line items | 🟡 | Existing invoices support line items, but not organization-level consolidated invoice generation |
| FR-58 | NET-30 credit terms with documented approval | 🧭 | Explicitly designed in the SRS and intentionally not enabled without financial/legal approval |

## Multi-Tenancy / White-Label (FR-59–FR-62)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-59 | Institution as tenant root for all student/staff university records | 🟡 | Institution and university references exist, but institution ownership is not mandatory on every required record |
| FR-60 | Institution-scoped university analytics | ✅ | University analytics resolves and authorizes the requesting staff member's institution |
| FR-61 | Configuration-driven institution onboarding | ✅ | Admin approval provisions `Institution` data without a deployment |
| FR-62 | Institution-scoped Talent API queries | 🟡 | `/partner/v1/talent/search` accepts comma-separated `institution_ids` and applies the filter after verified-student and consent checks; institutional tenancy and partner policy controls remain future |

## AI Governance & Explainability (FR-63–FR-66)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-63 | Recommendation factor breakdown | 🟡 | Recommendations expose matched skills and scores, but not a complete human-readable factor breakdown for every result |
| FR-64 | Recommendation method transparency | ✅ | Responses include `ranking_source`, and deterministic fallback is used when AI is unavailable |
| FR-65 | Aggregate recommendation outcome logging | ❌ | No separate aggregate outcome/fairness logging workflow exists |
| FR-66 | Versioned evaluation and bias-review checklist | ❌ | No completed, dated bias-review artifact is tracked |

## Objective Progress Evidence (FR-67–FR-72)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-67 | Incremental task work artifacts | ❌ | No task/artifact workflow exists |
| FR-68 | Repository commit ingestion | ❌ | No repository integration or commit-event module exists |
| FR-69 | Scoped repository authorization | ❌ | No repository OAuth linking workflow exists |
| FR-70 | Client checkpoint reviews | ❌ | No `CheckpointReview` model or route exists |
| FR-71 | Descriptive-only evidence timeline | ❌ | No task evidence timeline exists |
| FR-72 | Check-in fallback when no repository evidence exists | ❌ | Check-in/at-risk engine does not exist |

## Job Listing Types & Direct-Hire Applications (FR-73–FR-79)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-73 | Engagement type on every listing | ❌ | `Project` does not yet persist the SRS engagement-type enum |
| FR-74 | Independent work-arrangement field and filtering | ❌ | `Project` does not yet persist the SRS work-arrangement enum |
| FR-75 | Freelance/contract listings retain escrow workflow | 🟡 | Existing project/proposal/contract flow works, but it is not yet selected by an engagement-type field |
| FR-76 | Direct-hire applications for internship/part-time/full-time | ❌ | No `Application` model or direct-hire workflow exists |
| FR-77 | Independent engagement/work-arrangement filters | ❌ | Search filters do not expose these two independent facets |
| FR-78 | Explicit workflow labels on listings | ❌ | Listing UI does not yet distinguish escrow-protected work from direct-hire applications |
| FR-79 | Direct-hire posting fee/subscription | ❌ | No direct-hire billing product exists |

## Company Profiles (FR-80–FR-82)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-80 | Public company profile with active listings | ❌ | No public organization profile route/model exists |
| FR-81 | Follow-company notifications | ❌ | No company-follow model or notification workflow exists |
| FR-82 | Configurable public company reputation signals | ❌ | No public organization reputation settings or projection exists |

## Events (FR-83–FR-85)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-83 | Organization/staff event creation | ❌ | No `Event` model or event creation route exists |
| FR-84 | Student event registration and reminders | ❌ | No `EventRegistration` or reminder workflow exists |
| FR-85 | Past-event archive and resources | ❌ | No event archive exists |

## Articles & Public Site (FR-86–FR-89)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-86 | Controlled-category article publishing | 🟡 | Learning resources exist, but the SRS Article publishing workflow is not implemented |
| FR-87 | Public article browsing and category search | ❌ | No public Article route exists |
| FR-88 | Public top-level Jobs, Companies, Events, Articles, Contact, About navigation | 🟡 | Public navigation exists, but the complete SRS section set is not wired |
| FR-89 | Authenticated and visitor Contact Us routing | 🟡 | Support/dispute infrastructure exists, but the required visitor contact-message path is missing |

## Institution Onboarding (FR-90–FR-95)

| ID | Requirement (summary) | Status | Evidence |
| --- | --- | --- | --- |
| FR-90 | Staff submits institution onboarding request without live tenant creation | ✅ | `InstitutionOnboardingRequest` is created before approval; tenant provisioning occurs only in the admin decision path |
| FR-91 | Claimed-domain ownership verification before review | 🟡 | Domain syntax and duplicate checks exist, but contact-email ownership verification is not implemented |
| FR-92 | Admin-only pending review queue with no pre-approval provisioning | ✅ | Admin queue and pending-state checks exist; approval is required before institution provisioning |
| FR-93 | Approval provisions institution and first staff admin | ✅ | `decideOnboardingRequest` creates the institution and assigns the requester as staff admin |
| FR-94 | Duplicate-domain prevention with access-request guidance | ✅ | Existing active/pending domain checks prevent duplicate onboarding |
| FR-95 | Rejection reason and no partial tenant/account creation | 🟡 | Rejection persists a reason and creates no tenant; requester notification is not yet implemented |

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

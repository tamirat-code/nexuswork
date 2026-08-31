# Data dictionary

Field-by-field reference for every collection, generated from the Mongoose
schemas under `apps/backend/src/modules/**/*.model.js`. All collections have
`createdAt`/`updatedAt` (`timestamps: true`); those are omitted below unless a
collection disables them or adds something unusual.

Legend: **PK** = Mongo `_id`. **FK** = `ObjectId` reference. `minor` = integer
minor currency units (cents); no-suffix money fields are legacy major-unit
`Number`s kept for backward compatibility.

---

## Identity & access

### `User` (`users.model.js`)
| Field | Type | Notes |
| --- | --- | --- |
| email | String | unique, lowercase |
| password_hash | String | `select: false`; required only when `auth_provider="local"` |
| auth_provider | enum | `local`, `google` |
| google_id | String | unique, sparse |
| role | enum | `student`, `client`, `university_staff`, `admin` — **immutable in practice**, set at registration |
| name, phone, headline, bio, location, university, skills, website | String | profile fields; `skills` is a flat comma-separated string (legacy — see `StudentProfile.skills` for the structured version) |
| avatarUrl | String\|null | |
| universityVerified | Boolean | mirrors `Verification.status === "approved"` |
| notification_prefs | `{ email, push }` | Booleans, default true |
| preferred_language | enum | `en`, `am`, `af` |
| cv_file_id | FK → File | |
| staffVerified | Boolean | true only once an admin approves a `StaffVerification` |
| status | enum | `active`, `suspended`, `deactivated` |
| email_verified | Boolean | |
| mfa_enabled | Boolean | |
| mfa_secret_encrypted, mfa_pending_secret_encrypted, mfa_recovery_code_hashes | String/[String] | all `select: false` |
| failed_login_attempts, locked_until | Number, Date | login lockout |
| auth_session_version | Number | bumped on credential reset to invalidate outstanding JWTs |
| terms_accepted_at, terms_version | Date, String | |

### `StudentProfile` (`students.model.js`)
| Field | Type | Notes |
| --- | --- | --- |
| user_id | FK → User | unique (1:1) |
| university_id | FK → University | |
| enrollment_status | enum | `enrolled`, `graduated`, `on_leave`, `unknown` |
| verification_status | enum | `pending`, `verified`, `rejected` |
| student_id_number, program, bio | String | |
| skills[] | subdoc array | `category`, `name`, `level` (`beginner`..`expert`), `verification_method` (`self_declared`, `assessment`, `university_certified`), `evidence_file_id` (FK→File), `course_name`, `course_code`, `course_completed_at`, `assessment_method`, `assessment_score` (0–100), `assessment_notes`, `certified_by` (FK→User), `certified_at` |

Unique index: one `student_id_number` per `university_id` (partial — only when set).

### `ClientProfile` (`clients.model.js`)
| Field | Type | Notes |
| --- | --- | --- |
| user_id | FK → User | unique (1:1) |
| organization_name | String | |
| organization_type | enum | `individual`, `company`, `university_department`, `ngo`, `government` |
| verification_status | enum | `pending`, `verified`, `rejected` |
| document_file_id | FK → File | |
| reviewed_by, reviewed_at, rejection_reason | | admin review trail |
| additional_posters[] | [FK → User] | org accounts can delegate posting to multiple users |

### `University` (`universities.model.js`)
| Field | Type | Notes |
| --- | --- | --- |
| name | String | required |
| domain | String | unique — matched against a student's registration email for auto-verification eligibility |
| contact_staff[] | [FK → User] | |

### `RevokedToken` / `PasswordResetToken` / `EmailVerificationToken` (`tokens.model.js`)
Short-lived, TTL-indexed on `expires_at`. `RevokedToken` holds a JWT `jti`
blocklist entry; the reset/verification tokens store a `token_hash` (never the
raw token) plus `user_id` and, for password reset, a `used` flag.

---

## Verification & credentials

### `Verification` (`verifications.model.js`)
Student university-identity verification. `user_id`, `university_id` (FK),
`status` (`pending`/`approved`/`rejected`), `email_domain`,
`email_domain_matched` (Boolean — informational only, never auto-approves),
`full_name`, `student_id_number`, `program` (all required, self-declared at
submission), `document_file_id` (FK→File, required), `reviewed_by`,
`reviewed_at`, `rejection_reason`. Unique per `(user_id, university_id)`.

### `StaffVerification` (`staff-verifications.model.js`)
Same shape for `university_staff` accounts: `user_id`, `university_id`,
`status`, `email_domain`, `email_domain_matched`, `full_name`, `job_title`,
`department`, `document_file_id` (required), review trail. Unique per
`(user_id, university_id)`.

### `SkillCertificationRequest` (`skill-certification-request.model.js`)
A student's request for a university to certify one skill line-item.
`student_id`, `university_id` (FKs), `skill_name`, `skill_key`,
`evidence_file_id` (FK→File, required), `course_name`, `course_code`,
`course_completed_at`, `assessment_method` (`practical_assessment`,
`portfolio_review`, `coursework_linkage`), `student_notes`, `status`
(`pending`/`approved`/`rejected`), `assessment_score` (0–100), `review_notes`,
`reviewed_by`, `reviewed_at`. Only one **pending** request per
`(student_id, skill_key)` (partial unique index).

---

## Catalog

### `Category` (`categories.model.js`)
`name`, `slug` (both unique), `description`, `icon`, `is_active`, `sort_order`,
`proposal_price_floor_minor` (minor units; currency comes from the project).

### `Skill` (`skills.model.js`)
`name`, `slug` (both unique), `category`, `description`, `is_active`,
`proposal_price_floor_minor_by_level` — an object with `beginner`,
`intermediate`, `advanced`, `expert` minor-unit floors. Text index on
`name`/`category`.

### `LearningResource` (`learning.model.js`)
`title`, `description`, `category`, `resource_type` (`article`, `video`,
`course`, `tutorial`, `other`), `url`, `file_id` (FK→File), `author_id`
(FK→User), `tags[]`, `difficulty` (`beginner`..`advanced`, `all`),
`is_published`. Text index on `title`/`description`/`tags`.

---

## Marketplace core

### `Project` (`projects.model.js`)
| Field | Type | Notes |
| --- | --- | --- |
| client_id | FK → User | poster's own account |
| created_by | FK → User | may differ from `client_id` for org additional-posters |
| title, description | String | text-indexed |
| required_skill_ids[] | [FK → Skill] | canonical |
| required_skills[] | [String] | denormalized label list, kept for legacy reads/search |
| category, experience_level | String, enum (`beginner`..`expert`) | |
| budget_type | enum | `fixed`, `range` |
| budget, budget_min, budget_max | Number | major units |
| currency | enum | `USD`, `ETB` |
| deadline | Date | required |
| attachments[] | [FK → File] | |
| status | enum | `open`, `in_progress`, `completed`, `cancelled` |

### `Proposal` (`proposals.model.js`)
`project_id`, `student_id` (FKs), `price`/`price_minor`, `currency`,
`delivery_time_days`, `cover_note`, `cv_file_id` (FK→File, optional for
legacy rows, enforced at the service layer for new ones), `cv_viewed_by`,
`cv_viewed_at`, `status` (`pending`/`accepted`/`rejected`/`withdrawn`). Unique
per `(project_id, student_id)` — one proposal per student per project.

### `Contract` (`contracts.model.js`)
One contract per accepted proposal (`proposal_id` unique FK). `project_id`,
`client_id`, `student_id` (FKs). `status`: `pending_review` → `pending_signature`
→ `active` → `completed`/`terminated`. `version` (Number, starts at 1).
`terms` embedded object: `title`, `description`, `total_amount`, `currency`
(default `USD`), `delivery_time_days`, `deadline`, `revision_policy`,
`cancellation_terms`, `payment_terms` (each has a sane default string).
`terms_fingerprint` (hash of the terms, used to detect tampering/mismatch at
signature time). `client_review`/`student_review` (each party's acknowledgement
of a terms version before signing — `reviewed_at`, `contract_version`,
`terms_fingerprint`). `client_signature`/`student_signature` (each records
`signed_at`, `contract_version`, `terms_fingerprint`, `ip`, `user_agent`).
Convenience fields `client_signed_at`, `student_signed_at`, `signed_at`.

### `Milestone` (`milestones.model.js`)
`contract_id` (FK), `title`, `description`, `amount`/`amount_minor`,
`currency`, `due_date`, `sequence` (unique per contract). `status` state
machine: `not_funded` → `funding_pending` → `funded` → `in_progress` →
`submitted` → (`delivered` | `revision_requested` → back to `submitted`) →
`approved` → `release_pending` → (`released` | `release_failed`); `disputed`
branches off from any funded/in-progress/submitted/delivered state.
`max_revisions` (0–20, default 3), `revision_count`. `payout_status`
(`not_applicable`/`pending`/`paid`/`failed`), `payout_failure_reason`.
Timestamps: `funded_at`, `delivered_at`, `approved_at`, `released_at`.

### `Submission` (`submissions.model.js`)
`milestone_id` (FK), `version` (unique per milestone), `file_ids[]` (FK→File,
current), `file_url`/`file_urls[]` (legacy, pre-`File`-collection uploads),
`note`, `feedback`, `revision_reason`, `reviewer_id` (FK→User), `reviewed_at`,
`submitted_at`, `supersedes_submission_id` (FK→Submission — chains revisions),
`review_status` (`pending_review`/`revision_requested`/`approved`).

---

## Money movement

### `Payment` (`payments.model.js`)
`milestone_id` (FK). `amount`/`amount_minor`, `currency`. `direction`:
`deposit`, `release`, `refund`, `commission`. `status`: `created`, `pending`,
`ledger_pending`, `succeeded`, `failed`. Provider-specific fields for both
supported PSPs: Stripe (`stripe_payment_intent_id`, `stripe_charge_id`,
`stripe_transfer_id`, `stripe_refund_id`, `stripe_account_id`) and the
provider-agnostic set used by Chapa and future providers (`provider` —
`stripe`|`chapa`, `provider_payment_id`, `provider_reference`,
`provider_checkout_url`, `provider_refund_id`, `provider_operation_key`,
`provider_event_id`). Ledger linkage: `ledger_journal_id`,
`ledger_idempotency_key`. `processing_at`, `failure_code`, `failure_message`.
A partial unique index enforces **one active payment per
`(milestone_id, direction)`** so retries can't double-charge or double-release.

### `Invoice` (`invoices.model.js`)
`contract_id`, `milestone_id` (optional), `client_id`, `student_id` (FKs).
`invoice_number` (unique). `amount`/`amount_minor`, `currency`. `status`:
`draft`, `sent`, `paid`, `overdue`, `cancelled`. `due_date`, `paid_at`.
`line_items[]`: `description`, `quantity`, `unit_price`/`unit_price_minor`.

### `Wallet` (`wallets.model.js`)
One per user (`user_id` unique). `currency`. Stripe Connect fields
(`stripe_account_id`, `stripe_onboarding_complete`). Chapa payout fields
(`chapa_bank_code`, `chapa_account_name`, `chapa_account_number_encrypted`,
`chapa_account_number_last4` — the encrypted field is never returned by the
API, only the last-4). `withdrawal_lock_version`, `withdrawal_lock_until`
(optimistic-locking guard against concurrent withdrawal requests). **Note**:
there is no stored balance field — balance is derived by aggregating `Payment`
documents at read time (see `wallets.service.js`).

### `Withdrawal` (`withdrawal.model.js`)
`user_id` (FK), `amount`/`amount_minor`, `currency`, `status`
(`pending`/`paid`/`failed`), `stripe_payout_id` (unique, sparse),
`idempotency_key` (unique per user), `processing_at`, `failure_reason`,
`ledger_transaction_id`, `ledger_reversal_transaction_id`.

### `WebhookEvent` (`webhookEvent.model.js`)
Inbound-webhook idempotency/audit record. `event_id` (unique), `provider`,
`provider_event_id`, `provider_transaction_id`, `payment_id` (FK→Payment),
`request_id`, `type`, `status` (`processing`/`succeeded`/`failed`),
`processing_at`, `error_message`, `processed_at`.

---

## Financial ledger (append-only, minor units only)

See [`architecture/phase-2-financial-ledger.md`](../architecture/phase-2-financial-ledger.md)
for the design rationale. Both collections reject `update*`/`delete*` via
Mongoose `pre` hooks — corrections are new documents, never mutations.

### `FinancialAccount` (`financial-accounts.model.js`)
Chart-of-accounts entry. `key` (unique, immutable), `type`
(`asset`/`liability`/`revenue`/`expense`/`equity`, immutable), `currency`
(immutable), `owner_id` (FK→User, immutable, null for platform-level
accounts), `name`, `active`.

### `FinancialJournal` (`financial-journals.model.js`)
Double-entry journal, one document per transaction. `transaction_id`
(unique), `idempotency_key` (unique), `event_type`, `source_type`,
`source_id`, `provider_event_id`, `request_id`, `actor_id`/`actor_role`.
`entries[]` (embedded, immutable): `account_key`, `account_type`, `owner_id`,
`debit_minor`, `credit_minor`, `currency` — every entry set must balance
(enforced in `financial-ledger.service.js`, not the schema).
`reversed_transaction_id` links a reversal to the journal it reverses.

---

## Collaboration

### `Message` (`messaging.model.js`)
`contract_id` (FK), `sender_id` (FK→User), `body`, `attachments[]`
(FK→File).

### `Meeting` (`meetings.model.js`)
`contract_id`, `milestone_id` (optional) (FKs). `created_by`,
`host_user_id` (FK→User, both immutable). `title`, `description`,
`scheduled_start`, `scheduled_end`. `status`: `scheduled`, `waiting`,
`active`, `ended`, `cancelled`. `room_id` (unique, immutable — used as the
WebRTC/Socket.IO namespace room). `participants[]`: `user_id`, `role`
(`host`/`participant`), `joined_at`, `left_at`. `started_at`, `ended_at`,
`reminder_sent_at`.

### `Review` (`reviews.model.js`)
`contract_id` (FK), `reviewer_id`, `reviewee_id` (FK→User), `rating` (1–5),
`text`. One review per `(contract_id, reviewer_id)` — each side of a contract
leaves at most one review.

### `Dispute` (`disputes.model.js`)
`milestone_id` (FK), `opened_by` (FK→User), `reason`, `status`
(`open`/`under_review`/`resolved`), `resolution_summary`,
`pre_dispute_status` (snapshot of the milestone status when the dispute
opened, so it can be restored or referenced), `resolved_by`, `resolved_at`,
`outcome`.

---

## Portfolio & matching

### `PortfolioItem` (`portfolios.model.js`)
`user_id` (FK), `title`, `description`, `project_url`, `image_url`,
`file_id` (FK→File), `tags[]`, `is_published`. `milestone_id` (FK→Milestone,
optional, unique when present) links a portfolio entry to the paid work it
came from. `consent_status` (`not_required`/`pending`/`approved`/`denied`),
`consented_by`, `consented_at` — a client can be asked to consent before a
milestone's deliverable is shown publicly.

### `RecommendationCache` (`recommendation.model.js`)
One per student (`student_id` unique). `project_ids[]` (FK→Project),
`generated_at`, `model_provider`, `model_name` (default `skill-overlap`),
`model_version`. Caches the last AI/heuristic recommendation run so the UI
has an instant result while a fresh pass runs in the background.

---

## Platform operations

### `File` (`files.model.js`)
`owner_id` (FK→User), `filename`, `original_name`, `mimetype`, `size`,
`content_sha256` (64-char hex), `url`. `related_type`: `project_attachment`,
`submission`, `portfolio`, `message_attachment`, `contract`,
`verification_document`, `staff_verification_document`,
`skill_certification_evidence`, `cv`, `other`. `related_id` (polymorphic FK).

### `Notification` (`notifications.model.js`)
`user_id` (FK). `type` — a large enum covering proposal, contract, milestone,
payment, message, review, verification, staff-verification, dispute, and
meeting lifecycle events, plus a generic `system`. `title`, `body`, `data`
(Mixed — event-specific payload), `read_at`, `email_sent`.

### `AdminAction` (`admin.model.js`)
`admin_id` (FK→User), `action`, `target_type`, `target_id`, `details`
(Mixed). A lighter-weight log than `AuditLog`, used specifically by the admin
module's own action trail.

### `AnalyticsEvent` (`analytics.model.js`)
`user_id` (FK, optional — anonymous events allowed), `event_type`,
`entity_type`, `entity_id`, `metadata` (Mixed).

### `AuditLog` (`audit-logs.model.js`, collection `audit_logs`)
The platform's compliance-grade, **append-only** audit trail — see the
`AUDIT_ACTION_TYPES` enum in the model for the full list of ~65 tracked
actions across users, contracts, milestones, submissions, payments, disputes,
meetings, and withdrawals. `eventId` (unique), `eventType`, `action`,
`previousState`/`newState` (Mixed snapshots), `metadata`, `requestId`,
`correlationId` (ties one logical operation's events together), `actor_id`,
`actor_role` (`admin`/`moderator`/`client`/`student`/`university_staff`/
`system`), `action_type` (enum), `entity_type` (enum), `entity_id`,
`related_entity_type`/`related_entity_id`, `reason`, `details`, `ip_address`,
`user_agent`, `status` (`logged`/`flagged_for_review`).

### `AuditReview` (`audit-review.model.js`, collection `audit_reviews`)
A moderator/admin flag on one `AuditLog` entry. `audit_log_id` (FK, unique —
one review record per flagged log), `reviewer_id`, `reviewer_role`
(`admin`/`moderator`), `reason`, `status` (`flagged_for_review`),
`correlationId`.

---

## Placeholder

### `Search` (`search.model.js`)
`_placeholder: Boolean`. Not a real collection yet — see
`search.service.js`, which queries `Project`/`Skill`/`LearningResource`
directly via their text indexes instead of maintaining a denormalized search
index. Documented here so it isn't mistaken for a missing schema.

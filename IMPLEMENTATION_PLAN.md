# NexusWork Contract-to-Completion Implementation Plan

## Executive Summary

NexusWork has all major domain modules (contracts, milestones, payments, submissions, reviews, portfolios, disputes, messaging, notifications, audit logs). The gaps are:
1. **Contract states** are too coarse — missing `draft`, `pending_review`, `pending_signature` distinction
2. **No contract review step** — both parties sign but neither formally reviews terms
3. **No milestone creation UI** — client can fund but not create milestones
4. **No revision request** — button exists but has no action
5. **Chat send is a stub** — only shows toast, doesn't call API
6. **File upload is a stub** — button has no handler
7. **No contract completion logic** — no auto-complete when all milestones released
8. **Reviews not gated** — no check that contract is completed
9. **Payment not abstracted** — tightly coupled to Stripe

---

## Phase 1: Contract Agreement Flow (Review → Sign → Active)

### 1.1 Extend Status Enums

**File:** `apps/backend/src/shared/enums/status.enum.js`

```js
export const CONTRACT_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  PENDING_SIGNATURE: "pending_signature",
  ACTIVE: "active",
  COMPLETED: "completed",
  TERMINATED: "terminated",
});

export const MILESTONE_STATUS = Object.freeze({
  NOT_FUNDED: "not_funded",
  FUNDED: "funded",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  REVISION_REQUESTED: "revision_requested",
  APPROVED: "approved",
  RELEASED: "released",
  DISPUTED: "disputed",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  ESCROW_HELD: "escrow_held",
  RELEASE_PENDING: "release_pending",
  RELEASED: "released",
  REFUNDED: "refunded",
});
```

### 1.2 Extend Contract Model

**File:** `apps/backend/src/modules/contracts/contracts.model.js`

Add fields:
```js
// Review state
client_reviewed_at: Date,
student_reviewed_at: Date,
client_reviewed: { type: Boolean, default: false },
student_reviewed: { type: Boolean, default: false },

// Signature metadata
client_signing_ip: String,
student_signing_ip: String,
client_signing_method: String,  // "click" | "digital" | etc.
student_signing_method: String,

// Version tracking
version: { type: Number, default: 1 },
version_history: [{
  version: Number,
  changes: String,
  updated_by: ObjectId,  // ref: "User"
  updated_at: Date,
}],

// Terms
title: String,
description: String,
total_amount: Number,
currency: { type: String, default: "usd" },
start_date: Date,
end_date: Date,
cancellation_terms: String,
revision_policy: String,
```

### 1.3 Extend Contract Service — Add Review and Signature as Separate Actions

**File:** `apps/backend/src/modules/contracts/contracts.service.js`

Add new functions:
- `reviewContract(id, userId)` — Sets `client_reviewed`/`student_reviewed` + timestamp. Requires `status === "pending_review"`. When both reviewed, moves to `pending_signature`.
- `signContract(id, userId, signingMetadata)` — Updated to require `status === "pending_signature"` AND both parties reviewed. When both sign, moves to `active`.
- `updateContractTerms(id, userId, updates)` — Only allowed in `draft` status. Bumps version.

### 1.4 Extend Contract Controller

**File:** `apps/backend/src/modules/contracts/contracts.controller.js`

Add handlers:
- `review` — `POST /contracts/:id/review`
- `sign` — Updated to include metadata
- `updateTerms` — `PATCH /contracts/:id/terms`

### 1.5 Extend Contract Routes

**File:** `apps/backend/src/modules/contracts/contracts.routes.js`

Add:
```js
router.post("/:id/review", requireAuth, review);
router.patch("/:id/terms", requireAuth, updateTerms);
```

### 1.6 Update Proposal Accept Flow

**File:** `apps/backend/src/modules/proposals/proposals.service.js`

In `acceptProposal()`, change contract creation:
```js
// Before: status: "pending_signature"
// After:
status: "pending_review",
title: project.title,
description: `Contract for "${project.title}"`,
total_amount: proposal.price,
currency: "usd",
start_date: new Date(),
end_date: new Date(Date.now() + proposal.delivery_time_days * 86400000),
```

### 1.7 Frontend — Contract Review & Signature UI

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Replace the single "Sign contract" banner with a two-step flow:

1. **Review Banner** (when `status === "pending_review"`):
   - Shows contract terms summary (title, description, amount, dates, cancellation terms)
   - "Review Contract" button opens a dialog with full terms
   - After review: "I have reviewed and agree to these terms" checkbox + Confirm button
   - Calls `POST /contracts/:id/review`
   - Shows both parties' review status: "Client: Reviewed ✓ / Student: Reviewed ○"

2. **Signature Banner** (when `status === "pending_signature"`):
   - Shows "Both parties have reviewed. Ready for signatures."
   - Shows both parties' signature status
   - "Sign Contract" button with confirmation dialog
   - Calls `POST /contracts/:id/sign`

**New API functions** in `apps/frontend/src/services/api/contracts.api.js`:
```js
export function reviewContract(id, token) {
  return apiRequest(`/contracts/${id}/review`, { method: "POST", token });
}
```

### 1.8 Frontend Constants Update

**File:** `apps/frontend/src/constants/status.constants.js`

Add new contract statuses to the status metadata registry.

**File:** `apps/frontend/src/constants/payment.constants.js`

Add new milestone statuses (`in_progress`, `submitted`, `revision_requested`).

---

## Phase 2: Milestone Management

### 2.1 Extend Milestone Model

**File:** `apps/backend/src/modules/milestones/milestones.model.js`

Add fields:
```js
description: String,
sequence: { type: Number, default: 0 },
funded_at: Date,
started_at: Date,
delivered_at: Date,
approved_at: Date,
released_at: Date,
revision_count: { type: Number, default: 0 },
max_revisions: { type: Number, default: 3 },
payment_id: ObjectId,  // ref: "Payment"
```

Update enum:
```js
status: {
  type: String,
  default: "not_funded",
  enum: ["not_funded", "funded", "in_progress", "submitted", "revision_requested", "approved", "released", "disputed"],
},
```

### 2.2 Extend Milestone Service

**File:** `apps/backend/src/modules/milestones/milestones.service.js`

Update `createMilestone()`:
- Require contract `status === "active"`
- Accept `description`, `sequence`, `max_revisions`
- Auto-set `sequence` from existing milestone count

Update `submitWork()`:
- Change from `funded` → `delivered` to `funded`/`in_progress` → `submitted`
- Set `delivered_at` timestamp
- Support file arrays, not just single URL

Add `requestRevision(milestoneId, userId, feedback)`:
- Validate milestone is `submitted`
- Increment `revision_count`
- Check `revision_count < max_revisions`
- Set milestone status to `revision_requested`
- Store feedback on submission
- Notify student

Add `startWork(milestoneId, userId)`:
- Student signals work started
- Set `started_at` and status to `in_progress`

### 2.3 Extend Milestone Controller

**File:** `apps/backend/src/modules/milestones/milestones.controller.js`

Add:
- `requestRevision` handler
- `startWork` handler

### 2.4 Extend Milestone Routes

**File:** `apps/backend/src/modules/milestones/milestones.routes.js`

Add:
```js
router.post("/:id/start", requireAuth, startWork);
router.post("/:id/request-revision", requireAuth, requestRevision);
```

### 2.5 Frontend — Milestone Creation UI

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Add "Create Milestone" button (client only, when `contract.status === "active"`):

Dialog form with:
- Title (required)
- Description
- Amount (required, number)
- Due date (required, date picker)
- Max revisions (default 3)

**New API function** in `apps/frontend/src/services/api/milestones.api.js`:
```js
export function createMilestone(contractId, data, token) {
  return apiRequest(`/milestones/contract/${contractId}`, {
    method: "POST", body: data, token,
  });
}
export function requestRevision(milestoneId, data, token) {
  return apiRequest(`/milestones/${milestoneId}/request-revision`, {
    method: "POST", body: data, token,
  });
}
```

### 2.6 Frontend — Revision Request Modal

Replace the stub "Request revision" button in `MilestoneCard`:

Dialog with:
- Textarea for feedback (required, min 10 chars)
- Shows remaining revisions: "2 of 3 revisions remaining"
- Submit calls `POST /milestones/:id/request-revision`

### 2.7 Frontend — Submission History Fix

Replace the hardcoded "v1.0" in the submission history card with actual submission version numbers by fetching submissions for each milestone.

---

## Phase 3: Payment / Escrow Abstraction

### 3.1 Payment Provider Interface

**New file:** `apps/backend/src/modules/payments/payment-provider.interface.js`

```js
// Abstract interface — all methods must be implemented by providers
export class PaymentProviderInterface {
  async createIntent(amount, currency, metadata) { throw new Error("Not implemented"); }
  async confirmIntent(intentId) { throw new Error("Not implemented"); }
  async release(params) { throw new Error("Not implemented"); }
  async refund(paymentId) { throw new Error("Not implemented"); }
  async getStatus(paymentId) { throw new Error("Not implemented"); }
}
```

### 3.2 Stripe Provider Implementation

**New file:** `apps/backend/src/modules/payments/providers/stripe.provider.js`

Move current Stripe logic from `payments.service.js` into this class, implementing `PaymentProviderInterface`.

### 3.3 Payment Service Refactor

**File:** `apps/backend/src/modules/payments/payments.service.js`

Refactor to use `PaymentProviderInterface`:
```js
import { StripeProvider } from "./providers/stripe.provider.js";

const provider = new StripeProvider();

export async function createDepositIntent(milestone) {
  return provider.createIntent(milestone.amount, paymentConfig.currency, {
    milestone_id: String(milestone._id),
  });
}
```

### 3.4 Payment Confirmation Flow

Add explicit confirmation step in `milestones.service.js`:

```js
export async function confirmPaymentAndFund(milestoneId, userId) {
  // 1. Verify payment succeeded
  // 2. Set milestone to "funded"
  // 3. Set funded_at timestamp
  // 4. Notify student
  // 5. Create audit log
}
```

### 3.5 Payment Confirmation UI

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

When client clicks "Fund milestone":
1. Show confirmation dialog with: milestone amount, platform fee (10%), student amount, payment method
2. Client confirms → call `POST /milestones/:id/fund`
3. Show processing state
4. On success → show "Milestone secured — student has been notified"
5. On failure → show error with retry option

---

## Phase 4: Work Management (Submission & Review)

### 4.1 Extend Submission Model

**File:** `apps/backend/src/modules/submissions/submissions.model.js`

Add fields:
```js
file_urls: [String],       // multiple files
reviewer_id: ObjectId,     // ref: "User"
reviewed_at: Date,
feedback: String,          // client feedback
revision_reason: String,
milestone_id: ObjectId,    // already exists
```

Update enum:
```js
review_status: {
  type: String,
  default: "pending_review",
  enum: ["pending_review", "revision_requested", "approved"],
},
```

### 4.2 Extend Submission Service

**File:** `apps/backend/src/modules/submissions/submissions.service.js`

Update `addSubmission()`:
- Support multiple file URLs
- Support `file_urls` array

Update `requestRevision()`:
- Accept `reason` parameter
- Store `revision_reason` and `feedback`
- Set `reviewed_at` timestamp

### 4.3 Frontend — Submission Review Screen

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Replace the "Submission history" card with a proper submission review:

- For each submitted milestone, show:
  - Version number
  - Files/links (clickable)
  - Student notes
  - Client feedback (if any)
  - "Approve & Release" button
  - "Request Revision" button (opens dialog)

### 4.4 Frontend — File Upload Integration

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Wire the "Upload files" button:
1. Click → open file picker (input type="file")
2. Upload via `POST /files/upload` (already exists)
3. Show uploaded files list
4. Files are associated with contract via `related_type: "project_attachment"`

---

## Phase 5: Approval & Payment Release

### 5.1 Separate Approval from Release

**File:** `apps/backend/src/modules/milestones/milestones.service.js`

Split `approveMilestone()` into two steps:

```js
export async function approveMilestone(milestoneId, userId) {
  // 1. Validate milestone is "submitted"
  // 2. Set milestone status to "approved"
  // 3. Set approved_at timestamp
  // 4. Notify student of approval
  // 5. Return milestone (don't release yet)
}

export async function releaseMilestone(milestoneId, userId) {
  // 1. Validate milestone is "approved"
  // 2. Initiate payment release via provider
  // 3. Set milestone status to "released"
  // 4. Set released_at timestamp
  // 5. Create invoice
  // 6. Notify both parties
  // 7. Check if all milestones released → complete contract
}
```

### 5.2 Auto-Complete Contract

**File:** `apps/backend/src/modules/milestones/milestones.service.js`

After successful release:
```js
async function checkAndCompleteContract(contractId) {
  const contract = await Contract.findById(contractId);
  if (!contract || contract.status !== "active") return;

  const milestones = await Milestone.find({ contract_id: contractId });
  const allReleased = milestones.every(m => m.status === "released");

  if (allReleased) {
    contract.status = "completed";
    await contract.save();

    // Notify both parties
    // Create audit log
    // Enable reviews
  }
}
```

### 5.3 Frontend — Approve & Release Flow

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Split the "Approve & release" button into two steps:

1. **Approve** button → calls `POST /milestones/:id/approve`
   - Shows "Approved — ready for payment release"
   - New "Release Payment" button appears

2. **Release Payment** button → calls `POST /milestones/:id/release`
   - Shows processing state
   - On success: "Payment released — student will receive funds"

**New API functions** in `apps/frontend/src/services/api/milestones.api.js`:
```js
export function approveMilestone(milestoneId, token) {
  return apiRequest(`/milestones/${milestoneId}/approve`, { method: "POST", token });
}
export function releaseMilestone(milestoneId, token) {
  return apiRequest(`/milestones/${milestoneId}/release`, { method: "POST", token });
}
```

---

## Phase 6: Completion, Reviews & Portfolio

### 6.1 Gate Reviews Behind Contract Completion

**File:** `apps/backend/src/modules/reviews/reviews.service.js`

Update `submitReview()`:
```js
export async function submitReview(contractId, reviewerId, { reviewee_id, rating, text }) {
  const contract = await Contract.findById(contractId);
  if (!contract) throw new NotFoundError("Contract not found");
  if (contract.status !== "completed") {
    throw new ValidationError("Reviews can only be submitted after contract completion");
  }
  // ... existing logic
}
```

### 6.2 Add Review Prompt to ContractDetailPage

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

When `contract.status === "completed"` and user hasn't reviewed yet:
- Show a card: "How was your experience working with [partner]?"
- "Leave a Review" button
- Opens the `ReviewsSection` component (already exists)

### 6.3 Verified Portfolio Integration

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

When `contract.status === "completed"` and user is the student:
- Show "Add to Portfolio" button on each released milestone
- Calls `POST /portfolios/from-milestone/:milestoneId` (already exists)

### 6.4 Notification Triggers

**File:** `apps/backend/src/modules/milestones/milestones.service.js`

Add notifications at key lifecycle events:
- Milestone funded → notify student
- Work submitted → notify client
- Revision requested → notify student
- Milestone approved → notify student
- Payment released → notify student
- Contract completed → notify both parties
- Review received → notify reviewee

---

## Phase 7: Dispute Workflow Integration

### 7.1 Milestone Protection

**File:** `apps/backend/src/modules/disputes/disputes.service.js`

Update `openDispute()`:
- When dispute opened on funded milestone, mark milestone as `disputed`
- Log that funds are frozen
- Notify admin

### 7.2 Dispute Resolution

**File:** `apps/backend/src/modules/disputes/disputes.service.js`

Update `resolveDispute()`:
- After resolution, check if contract should be completed
- Update milestone status accordingly
- Notify both parties of resolution

---

## Phase 8: Chat Fix

### 8.1 Wire ChatPanel Send

**File:** `apps/frontend/src/features/contracts/ContractDetailPage.jsx`

Replace the stub toast with actual API call:

```jsx
const sendMessageMutation = useMutation({
  mutationFn: (body) => messagesApi.sendMessage(contractId, { body }, token),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["messages", contractId] });
  },
});

// In the form onSubmit:
onSubmit={(e) => {
  e.preventDefault();
  if (!message.trim()) return;
  sendMessageMutation.mutate(message.trim());
  setMessage("");
}}
```

**Import** `sendMessage` from `messages.api.js`.

---

## File Change Summary

### Backend Files to Modify

| File | Changes |
|------|---------|
| `shared/enums/status.enum.js` | Add `draft`, `pending_review` to CONTRACT_STATUS; add `in_progress`, `submitted`, `revision_requested` to MILESTONE_STATUS; add payment statuses |
| `modules/contracts/contracts.model.js` | Add review fields, signature metadata, version tracking, terms fields |
| `modules/contracts/contracts.service.js` | Add `reviewContract()`, update `signContract()`, add `updateContractTerms()` |
| `modules/contracts/contracts.controller.js` | Add `review`, `updateTerms` handlers |
| `modules/contracts/contracts.routes.js` | Add `POST /:id/review`, `PATCH /:id/terms` |
| `modules/milestones/milestones.model.js` | Add description, sequence, lifecycle timestamps, max_revisions, payment_id; update status enum |
| `modules/milestones/milestones.service.js` | Add `requestRevision()`, `startWork()`, `releaseMilestone()`, `checkAndCompleteContract()`; update `createMilestone()`, `submitWork()`, `approveMilestone()` |
| `modules/milestones/milestones.controller.js` | Add `requestRevision`, `startWork`, `release` handlers |
| `modules/milestones/milestones.routes.js` | Add `POST /:id/start`, `POST /:id/request-revision`, `POST /:id/release` |
| `modules/payments/payments.service.js` | Refactor to use provider interface |
| `modules/payments/payments.model.js` | Add `escrow_held_at`, `release_pending_at`, `released_at` |
| `modules/submissions/submissions.model.js` | Add `file_urls`, `reviewer_id`, `reviewed_at`, `feedback`, `revision_reason` |
| `modules/submissions/submissions.service.js` | Update `addSubmission()`, `requestRevision()` with reason |
| `modules/submissions/submissions.controller.js` | Update `flagRevision` to accept body |
| `modules/proposals/proposals.service.js` | Update `acceptProposal()` to create contract with `pending_review` status and terms |
| `modules/reviews/reviews.service.js` | Gate behind `contract.status === "completed"` |
| `modules/disputes/disputes.service.js` | Add notification triggers, contract completion check |
| `modules/notifications/notifications.service.js` | No changes needed (already works) |

### New Backend Files

| File | Purpose |
|------|---------|
| `modules/payments/payment-provider.interface.js` | Abstract payment provider interface |
| `modules/payments/providers/stripe.provider.js` | Stripe implementation of payment provider |

### Frontend Files to Modify

| File | Changes |
|------|---------|
| `features/contracts/ContractDetailPage.jsx` | Two-step review/sign flow, milestone creation dialog, revision request modal, approve+release split, chat fix, file upload, review prompts, portfolio action, submission history fix |
| `features/contracts/ContractsPage.jsx` | Show contract status badges with new statuses |
| `services/api/contracts.api.js` | Add `reviewContract`, `updateContractTerms` |
| `services/api/milestones.api.js` | Add `createMilestone`, `requestRevision`, `startWork`, `releaseMilestone` |
| `services/api/messages.api.js` | Already has `sendMessage` — just needs to be imported |
| `constants/status.constants.js` | Add new contract/milestone/payment statuses |
| `constants/payment.constants.js` | Add new milestone statuses |

### New Frontend Files

| File | Purpose |
|------|---------|
| `features/contracts/components/ContractReviewBanner.jsx` | Review state banner |
| `features/contracts/components/ContractSignatureBanner.jsx` | Signature state banner |
| `features/contracts/components/CreateMilestoneDialog.jsx` | Milestone creation form |
| `features/contracts/components/RequestRevisionDialog.jsx` | Revision request form |
| `features/contracts/components/PaymentConfirmationDialog.jsx` | Payment confirmation UI |
| `features/contracts/components/SubmissionReviewCard.jsx` | Submission review with approve/revision |

---

## Implementation Order

### Sprint 1: Contract Agreement (Days 1-3)
1. Extend enums (status.enum.js)
2. Extend Contract model (contracts.model.js)
3. Add reviewContract service + controller + route
4. Update signContract to require review first
5. Update acceptProposal to create draft contract
6. Frontend: ContractReviewBanner + ContractSignatureBanner
7. Update ContractDetailPage with two-step flow
8. Update status constants

### Sprint 2: Milestone Management (Days 4-6)
1. Extend Milestone model
2. Add milestone creation to service + controller + route
3. Add requestRevision to service + controller + route
4. Frontend: CreateMilestoneDialog
5. Frontend: RequestRevisionDialog
6. Frontend: Wire revision request button
7. Fix submission history to show real versions

### Sprint 3: Payment Abstraction (Days 7-9)
1. Create payment provider interface
2. Extract Stripe provider
3. Refactor payment service
4. Separate approve from release
5. Add releaseMilestone endpoint
6. Frontend: PaymentConfirmationDialog
7. Frontend: Split approve/release buttons

### Sprint 4: Completion & Reviews (Days 10-11)
1. Add contract auto-completion logic
2. Gate reviews behind completion
3. Frontend: Review prompts on completed contracts
4. Frontend: Add to Portfolio action
5. Add notification triggers at all lifecycle events

### Sprint 5: Chat, Files & Polish (Days 12-14)
1. Wire ChatPanel send to actual API
2. Wire file upload button
3. Dispute workflow integration
4. End-to-end testing
5. Bug fixes

---

## Critical Business Rules Enforcement

| Rule | Enforcement Point |
|------|-------------------|
| Contract requires both review + both signatures before ACTIVE | `contracts.service.js` — `signContract()` checks both `*_reviewed` and `*_signed_at` |
| Milestone cannot be funded unless contract is ACTIVE | `milestones.service.js` — `initiateFunding()` already checks `contract.status === "active"` |
| Student not told work is secured until payment confirmed | `milestones.service.js` — `confirmPaymentAndFund()` only sets `funded` after provider confirms |
| Client cannot approve/release without submission | `milestones.service.js` — `approveMilestone()` checks `status === "submitted"` |
| Revision request preserves previous versions | `submissions.service.js` — `addSubmission()` increments version, never deletes |
| Payment release confirmed by provider before RELEASED | `milestones.service.js` — `releaseMilestone()` only sets `released` after provider success |
| Contract completed only after all milestones released | `milestones.service.js` — `checkAndCompleteContract()` runs after each release |
| Reviews only after contract completion | `reviews.service.js` — `submitReview()` checks `contract.status === "completed"` |
| Verified portfolio references actual work | `portfolios.service.js` — `addFromMilestone()` already links to milestone_id |
| Every state transition auditable | `milestones.service.js` + `contracts.service.js` — call `logAction()` at each transition |

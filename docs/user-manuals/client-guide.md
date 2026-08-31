# Client guide

## 1. Verify your organization (recommended)

At **Profile → Verification**, submit your organization name, type
(individual, company, university department, NGO, or government), and a
supporting document. An admin reviews it. Verification isn't required to post
projects, but it builds trust with students reviewing your proposals.

If you're an organizational account, you can add **additional posters** —
other users who can post/manage projects under your organization — from your
client profile page.

## 2. Post a project

At `/projects/new`: title, description, required skills (from the platform's
skill catalog), category, experience level, fixed or range budget, currency
(USD or ETB), deadline, and optional attachments. Requires a verified email.

## 3. Review proposals

- Incoming proposals for your projects appear at `/projects/:id` or a
  dedicated proposals view. Each shows price, delivery time, cover note, and
  the student's verified/self-declared skill profile.
- **View the CV** before deciding — this is tracked (helps the student know
  their proposal was actually reviewed).
- **Accept** one proposal to form a contract, or **reject** with the rest
  automatically remaining open for other students unless you close the
  project.

## 4. Contract and milestones

1. After acceptance, a contract is created in `pending_review`. **Review**
   the terms, then **sign** (requires a verified email). Both parties must
   sign before the contract is `active`.
2. Break work into milestones if not already structured that way, each with
   an amount and due date.
3. **Fund** each milestone before the student starts — this charges you
   (card via Stripe, or Chapa hosted checkout for ETB) and places funds in
   escrow. The student can't begin until a milestone shows `funded`.
4. When the student submits work, you can:
   - **Approve** — releases payment (minus platform commission) to the
     student.
   - **Request a revision** — with feedback; the student resubmits.
   - **Open a dispute** — if you can't reach agreement; an administrator
     reviews and resolves it.
5. If a release fails for a provider-side reason, you (or an admin) can
   **retry** it — funds aren't lost, the retry re-attempts the same release.

## 5. Portfolio consent

When a student adds an approved milestone from your contract to their public
portfolio, you'll be asked to **consent** — approve or deny showing that
specific deliverable publicly. Nothing is shown without your response.

## 6. Reviews, messaging, meetings

Leave a review after the contract completes. Message the student directly
from the active contract (`/chat`), and schedule video calls at `/meetings`.

## 7. Invoices and payment history

`/invoices` and `/payments` give you a record of every charge and its status,
with downloadable invoices for accounting.

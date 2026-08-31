# Student guide

## 1. Get verified

Before you can submit proposals or appear in client search, get your
university identity verified:

1. Go to **Profile → Verification** and submit your full name, student ID
   number, program, and a proof document (student ID card, enrolment letter,
   or transcript). If your registration email matches your university's
   registered domain, that's noted automatically — it does not by itself
   approve you.
2. A **University Staff** reviewer at your university approves or rejects the
   request. You'll get a notification either way; a rejection includes a
   reason and you can resubmit.

## 2. Build your profile and skills

At `/profile`, add a headline, bio, and skills. Each skill can be:
- **Self-declared** — you added it yourself, no evidence.
- **Assessment-verified** — you submit evidence (course name/code, a
  practical assessment, portfolio review, or coursework linkage) via
  **Verification → Request skill certification**; a university staff member
  reviews and scores it.

Verified skills are weighted more heavily in AI project matching and in
client search than self-declared ones — it's worth doing for skills you
actually want work in.

## 3. Find work

- **Browse/search projects** at `/projects` — filter by category, skill,
  budget, and deadline.
- **Recommended for you** at `/recommendations` — an AI/heuristic match based
  on your verified and self-declared skills.
- **Submit a proposal**: price, delivery time in days, and a cover note.
  Attach your CV. You can submit **one proposal per project** — resubmitting
  isn't possible, but withdrawing and reapplying is if the project is still
  open.
- Proposal pricing has a floor set by the project's category/skill level, to
  discourage underpricing — the form tells you the minimum before you submit.
- There is **no bidding-credit cost and no monthly proposal cap** for
  verified students.

## 4. Contract and milestones

1. When a client accepts your proposal, a **contract** is created in
   `pending_review` status at `/contracts`.
2. Both you and the client must **review** the contract terms (title,
   description, total amount, delivery time, deadline, revision/cancellation/
   payment policy) before either can sign.
3. Once both have reviewed, **sign** the contract — this requires a verified
   email. The contract becomes `active`.
4. The client **funds** each milestone (escrow) before you start work on it.
   You'll get a notification when a milestone is `funded`.
5. **Start** the milestone, do the work, then **submit** your deliverable
   (files + a note) at the milestone page. Submissions are versioned — if the
   client requests a revision, resubmit and the version number increments.
6. Once the client **approves**, payout is released through the active
   payment provider (Stripe transfer or Chapa payout, depending on your
   payout setup — see §6). You do not need to do anything further; release
   happens automatically once approved (a client/admin can retry manually if
   a release fails).

If you and the client disagree about a milestone, either side can **open a
dispute**; it goes to platform administrators for resolution and the
milestone's normal flow pauses.

## 5. Portfolio and reviews

- After a milestone is approved, you can add it to your **portfolio**
  (`/portfolios`) with one click — but the client must consent before it's
  shown publicly if it references their project specifics.
- After the contract completes, both you and the client can leave a
  **review** (1–5 stars + text). Reviews feed your public reputation.

## 6. Getting paid

1. Go to `/wallet` and complete payout-account onboarding — either **Stripe
   Connect** (international/USD clients) or **Chapa bank details** (ETB
   payouts), depending on which provider applies to your contracts.
2. `/wallet` shows your transaction history and payout status. There is no
   stored "balance" you draw down from directly — each approved milestone
   pays out individually, and you can also **withdraw** accumulated payouts
   explicitly if your payout method requires a separate withdrawal step.
3. A platform **commission** is deducted from each release. It's a flat rate,
   and is **waived entirely** once you've completed enough milestones
   (a configurable threshold, currently 3 by default) — check your commission
   preview before accepting a proposal to see exactly what applies to you.

## 7. Communication and meetings

- Message the client directly from an active contract at `/chat`.
- Schedule or join a video call at `/meetings` — calls are peer-to-peer
  (WebRTC) between contract parties, scoped to that contract.

## 8. Invoices

`/invoices` lists invoices generated against your contracts, with PDF/CSV
download.

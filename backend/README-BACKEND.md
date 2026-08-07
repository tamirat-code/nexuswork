# NexusWork — Backend Implementation Guide

> **Audience:** Backend developer joining the project.
> **Status:** The frontend (React 19 + Vite + Tailwind + Framer Motion) is **complete** and currently runs on **mock data** (`src/data/*.js`, `src/context/AuthContext.jsx`). Your job is to build the real API described in this document so the frontend can swap mocks for live endpoints.

---

## 1. Product Overview

NexusWork is an **AI-assisted, university-backed freelance marketplace**:

- **Students** (verified by their university) bid on projects and get paid via milestone escrow.
- **Clients** post briefs, review AI-ranked proposals, approve milestones, and release funds.
- **University staff** verify enrollment/skills and view graduate outcomes.
- **Admins** oversee users, disputes, categories, revenue, and audit logs.

Core loop: `Register → Verify → Post/Bid → Contract → Fund escrow → Deliver → Approve → Release → Review`.

---

## 2. Roles & Permission Matrix

| Capability                   | student  |  client  | university_staff |    admin     |
| ---------------------------- | :------: | :------: | :--------------: | :----------: |
| Browse projects / save       |    ✅    |    ✅    |        👁        |      ✅      |
| Submit proposals             |    ✅    |    —     |        —         |      —       |
| Post / pause projects        |    —     |    ✅    |        —         |      ✅      |
| Accept / decline proposals   |    —     | ✅ (own) |        —         |      —       |
| Submit milestone work        | ✅ (own) |    —     |        —         |      —       |
| Approve / request revision   |    —     | ✅ (own) |        —         | ✅ (dispute) |
| Verify enrollments & skills  |    —     |    —     |   ✅ (own uni)   |      ✅      |
| Wallet / withdraw / invoices |    ✅    |    ✅    |        —         |      —       |
| Messaging (contract-scoped)  |    ✅    |    ✅    |        —         |      ✅      |
| User management / suspend    |    —     |    —     |        —         |      ✅      |
| Disputes resolve             |    —     |    —     |        —         |      ✅      |
| Categories / reports / audit |    —     |    —     |        —         |      ✅      |

---

## 3. Recommended Tech Stack

| Layer                               | Choice                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| Runtime                             | Node 20 + Express (NestJS acceptable)                                                        |
| DB + ORM                            | **PostgreSQL + Prisma** (MongoDB+Mongoose acceptable)                                        |
| Cache / rate-limit / socket adapter | Redis                                                                                        |
| Realtime                            | Socket.IO                                                                                    |
| Auth                                | JWT access (15 min) + rotating refresh (7 d, httpOnly cookie), bcrypt (12), speakeasy (TOTP) |
| Validation                          | zod                                                                                          |
| Storage                             | S3-compatible (or `/uploads` for local dev)                                                  |
| Email                               | Nodemailer (SMTP)                                                                            |
| Payments                            | Chapa, Telebirr, CBE Birr (local) + Stripe/PayPal (intl)                                     |
| Tests                               | Vitest + Supertest                                                                           |

---

## 4. Repo Structure

    backend/
    ├─ prisma/schema.prisma
    ├─ .env.example
    └─ src/
       ├─ config/          (env, db, redis)
       ├─ middlewares/     (auth, rbac, validate, rateLimit, errorHandler, audit)
       ├─ lib/             (jwt, otp, mail, storage, payments/{chapa,telebirr,stripe,paypal})
       ├─ modules/
       │  ├─ auth/  users/  verifications/  projects/  proposals/
       │  ├─ contracts/  wallet/  messaging/  notifications/
       │  ├─ reviews/  disputes/  categories/  admin/
       ├─ sockets/         (index.js, events.js)
       ├─ seeds/           (demo.js)
       ├─ app.js
       └─ server.js

---

## 5. Environment Variables (`.env.example`)

    NODE_ENV=development
    PORT=5000
    DATABASE_URL=postgresql://user:pass@localhost:5432/nexuswork
    REDIS_URL=redis://localhost:6379
    ACCESS_TOKEN_SECRET=change_me
    REFRESH_TOKEN_SECRET=change_me_too
    ACCESS_TOKEN_TTL=15m
    REFRESH_TOKEN_TTL=7d
    CORS_ORIGINS=http://localhost:5173
    ADMIN_INVITE_CODES=NEXUS2026            # server-side only; never ship to frontend
    SMTP_URL=smtp://user:pass@host:587
    MAIL_FROM="NexusWork <no-reply@nexuswork.io>"
    S3_ENDPOINT=  S3_BUCKET=  S3_ACCESS_KEY=  S3_SECRET_KEY=
    CHAPA_KEY=  TELEBIRR_KEY=  STRIPE_KEY=  PAYPAL_CLIENT_ID=

---

## 6. Database Schema (Prisma-style summary)

**Enums**
`Role(student|client|university_staff|admin)` · `UserStatus(active|suspended|pending)` ·
`VerificationStatus(pending|verified|rejected)` · `ProjectStatus(open|paused|assigned|closed)` ·
`ProposalStatus(pending|accepted|declined)` · `ContractStatus(active|completed|disputed|cancelled)` ·
`MilestoneStatus(pending|funded|in_progress|delivered|released|revision|disputed)` ·
`TxnType(released|escrow|withdrawal|fee|refund)` · `DisputeStatus(open|under_review|resolved)`

**Models (key fields)**

- **User** — id, role, firstName, middleName?, lastName, username UQ, email UQ, phone?, passwordHash, avatarUrl?, status, twoFaEnabled, twoFaSecret?, createdAt
- **StudentProfile** — userId, university, studentIdNumber, college?, department?, program?, yearOfStudy?, graduationYear?, cgpa?, skills[], githubUrl?, linkedinUrl?, portfolioUrl?, verificationStatus
- **ClientProfile** — userId, companyName?, industry?, companySize?, jobTitle?, website?, paymentVerified
- **UniversityStaffProfile** — userId, university, staffId, position, officialEmail
- **VerificationRequest** — id, studentId, staffId?, type(enrollment|skill), evidenceUrl, status, note?, decidedAt?
- **Project** — id, clientId, title, category, summary?, description, budgetType(fixed|hourly), budgetMin, budgetMax?, currency, experienceLevel, duration, skills[], attachments[], status, featured, urgent, remote, views
- **Proposal** — id, projectId, studentId, coverLetter, bidAmount, deliveryDays, attachments[], status
- **Contract** — id, projectId, proposalId, clientId, studentId, totalAmount, status, startDate, endDate
- **Milestone** — id, contractId, idx, title, amount, dueDate, status, deliverableUrl?, submittedAt?, feedback?, releasedAt?
- **Wallet** — userId, available, escrow, pending
- **Transaction** — id, userId, type, amountSigned, refType, refId, description, status, createdAt
- **Withdrawal** — id, userId, method(chapa|telebirr|cbebirr|paypal|stripe|bank), amount, fee, account JSON, status
- **Invoice** — id, contractId, milestoneId, amount, tax, status, pdfUrl?
- **Review** — id, contractId, reviewerId, revieweeId, rating, skillRatings{communication,quality,timeliness,professionalism}, comment, reply?
- **Conversation** — id, contractId, participantIds[]
- **Message** — id, conversationId, senderId, body, attachmentUrl?, readBy[], createdAt
- **Notification** — id, userId, type, title, body, read, createdAt
- **Dispute** — id, contractId, openedBy, reason, studentClaim, clientClaim, evidence[], status, resolution?, resolvedBy?
- **Category** — id, name, slug, skills[], status, order
- **AuditLog** — id, actorId, action, entity, entityId, meta JSON, ip, ua, createdAt
- **Session** — id, userId, refreshHash, ua, ip, lastSeen, revoked

---

## 7. Auth & Security Rules

1. **Register** — per-role zod schemas; `role=admin` requires a code from `ADMIN_INVITE_CODES`; students get `verificationStatus=pending`.
2. **Login** — bcrypt compare; if `twoFaEnabled`, return `{ tempToken }` and require `POST /auth/2fa/verify` (TOTP via speakeasy; issue 10 hashed backup codes at enrollment).
3. **Tokens** — access JWT in `Authorization: Bearer`; refresh in **httpOnly, Secure, SameSite=Strict** cookie with **rotation + reuse detection** (revoke family on reuse).
4. **Rate limits** — `/auth/login` 10/15 min/IP; `/auth/register` 5/h/IP; global 100/15 min.
5. **RBAC** — `requireAuth`, `requireRole(...)`, `can(permission)` middlewares per matrix §2.
6. **Audit** — every admin action + every financial action writes `AuditLog` inside the same DB transaction.
7. **Hygiene** — helmet, CORS whitelist, zod on every route, Prisma parameterized queries, multipart MIME/size checks (≤ 50 MB).

---

## 8. API Reference (base `/api`)

### Auth

| Method & Path                                          | Roles  | Purpose                               |
| ------------------------------------------------------ | ------ | ------------------------------------- |
| POST /auth/register                                    | public | Create account (role-specific fields) |
| POST /auth/login                                       | public | → tokens or `{tempToken}` if 2FA      |
| POST /auth/2fa/verify                                  | temp   | Verify TOTP → tokens                  |
| POST /auth/refresh                                     | cookie | Rotate refresh token                  |
| POST /auth/logout                                      | any    | Revoke session                        |
| GET /auth/me                                           | any    | Current user + profile                |
| POST /auth/forgot-password · POST /auth/reset-password | public | Email reset flow                      |

Sample login response:

    {
      "accessToken": "eyJ...",
      "user": { "id": 1, "role": "student", "name": "Selam M.",
                "email": "student@test.com", "verificationStatus": "verified" }
    }

### Users & Verifications

| GET /users?q=&role=&status=&page= | admin | List/search users |
| GET /users/:id | admin/self | Profile detail |
| PATCH /users/:id/status | admin | Suspend / activate |
| PATCH /users/me | any | Update own profile |
| GET /verifications?status=pending | university_staff | Queue |
| POST /verifications/:id/approve · /reject | university_staff | Decide (+notify student) |
| POST /verifications/request | student | Submit evidence |

### Projects & Proposals

| GET /projects | public | Filters: `q, category, budgetType, minBudget, maxBudget, experience, skills, featured, urgent, remote, sort, page` |
| GET /projects/recommended | student | AI-ranked feed (`matchScore`) |
| GET /projects/:id | public | Detail (+views++) |
| POST /projects | client | Create |
| PATCH /projects/:id · POST /projects/:id/pause · /resume | client (owner) | Manage |
| GET /projects/saved · POST /projects/:id/save · DELETE /projects/:id/save | student | Bookmarks |
| POST /proposals | student | `{projectId, coverLetter, bidAmount, deliveryDays}` |
| GET /proposals/mine | student | Track own bids |
| GET /projects/:id/proposals | client (owner) | Review bids |
| POST /proposals/:id/accept · /decline | client (owner) | Accept → auto-create Contract + milestones |

Sample project item (match frontend card fields):

    { "id": "proj-001", "title": "University Event Management Web App",
      "budgetType": "fixed", "budget": 800, "experienceLevel": "Intermediate",
      "estimatedDuration": "2 to 4 weeks", "skills": ["React","Node.js"],
      "proposals": 4, "matchScore": 96, "featured": true, "urgent": false,
      "client": { "name": "Daniel T.", "rating": 4.9, "spent": 2400, "verified": true } }

### Contracts, Milestones, Escrow

| POST /contracts/:id/milestones/:mid/fund | client | Move client available→escrow; status `funded` |
| POST .../start | student | `funded → in_progress` |
| POST .../submit | student | `{deliverableUrl}` → `delivered` (+notify client) |
| POST .../approve | client | Release: escrow→student available (minus fee); write Invoice + Transactions |
| POST .../revise | client | `{feedback}` → `revision` (back to student) |
| GET /contracts · GET /contracts/:id | parties | Detail w/ milestones + chat |

### Wallet

| GET /wallet/balance | student/client | `{available, escrow, pending, lifetime}` |
| GET /wallet/transactions?page= | any | Ledger |
| POST /wallet/withdraw | any | `{method, amount, account}`; min-amount + balance checks; provider webhook completes |
| GET /wallet/invoices · GET /wallet/invoices/:id/pdf | parties | Statements |

### Messaging & Notifications (REST + Socket.IO)

| GET /conversations · GET /conversations/:id/messages | parties | History |
| POST /conversations/:id/messages | parties | Also emits `message:new` |
| Socket events (auth via handshake token): `message:new`, `typing`, `notification:new`, `milestone:updated` |
| GET /notifications · POST /notifications/:id/read · POST /notifications/read-all | any | Center |

### Reviews

| POST /reviews | parties (after contract completed) | `{contractId, rating, skillRatings, comment}` |
| GET /users/:id/reviews | public | Portfolio page |
| POST /reviews/:id/reply | reviewee | Reply |

### Admin

| GET /admin/stats | admin | Dashboards KPIs |
| GET /admin/disputes · POST /admin/disputes/:id/resolve `{resolution}` | admin | release_to_student / refund_to_client / split_50_50 |
| GET/POST/PATCH/DELETE /admin/categories | admin | CRUD |
| GET /admin/reports/monthly | admin | Revenue/growth series |
| GET /admin/audit-logs?actor=&action= | admin | Immutable trail |

---

## 9. Escrow Ledger Rules (MUST hold inside DB transactions)

1. **Fund:** client.available −= a; client.escrow += a; `Transaction(escrow, −a)`.
2. **Release:** client.escrow −= a; student.available += a−fee; platform += fee; `Transaction(released,+a−fee)` + `Transaction(fee,−fee)`; Invoice created.
3. **Withdraw:** available −= a; `Withdrawal(pending)`; provider webhook → completed/failed.
4. **Invariant:** `Σ wallets.escrow == Σ milestones(funded|in_progress|delivered|revision).amount` — assert nightly.

---

## 10. Email & Notification Triggers

proposal accepted/declined · milestone funded/submitted/approved/revision · withdrawal completed · verification decided · dispute opened/resolved · new message (digest).

---

## 11. AI Matching (v1 — keep simple)

    score = 0.6 * (|student.skills ∩ brief.skills| / |brief.skills|)
          + 0.25 * successRate + 0.15 * (rating / 5)

Return as `matchScore` (0–100) on `/projects/recommended` and project cards. v2: embeddings + history.

---

## 12. Frontend Integration Checklist (do last)

1. Frontend `.env`: `VITE_API_URL=http://localhost:5000/api`
2. Add `src/lib/api.js` (axios instance + interceptors: attach access token; on 401 → `POST /auth/refresh` once → retry; on second 401 → logout).
3. Replace mocks, in this order: `context/AuthContext.jsx` → `data/projects.js` → `data/contracts.js` → `data/wallet.js` → `data/users.js` → `data/portfolio.js` → dashboard fetches (wrap with TanStack Query).
4. **Remove from frontend:** hardcoded 2FA code `246810` and admin code `NEXUS2026` (now server-side).
5. Swap `localStorage` session for cookie-based refresh flow.

**Demo credentials to seed (match current frontend mocks):**

| email               | password | role               |
| ------------------- | -------- | ------------------ |
| student@test.com    | 123456   | student (verified) |
| client@test.com     | 123456   | client             |
| university@test.com | 123456   | university_staff   |
| admin@test.com      | 123456   | admin              |

Seed also: 5 projects (ids `proj-001…005`), 2 contracts with 3–4 milestones each (mirror `src/data/contracts.js`), wallets, 8 transactions, 4 invoices.

---

## 13. Suggested Build Order (~2 weeks)

1. **Sprint 1:** Setup, Prisma schema, auth (register/login/2FA/refresh), RBAC, audit middleware, seeds.
2. **Sprint 2:** Users + verifications + projects + proposals.
3. **Sprint 3:** Contracts + milestones + wallet ledger + withdrawals + invoices.
4. **Sprint 4:** Socket.IO messaging/notifications, reviews, disputes, categories, reports; payment provider sandboxes; tests + Postman collection.

---

## 14. Definition of Done (acceptance = frontend flows pass with real API)

- [ ] Register each role → login → 2FA → dashboard shows seeded data
- [ ] University approves verification → student badge flips live
- [ ] Client posts project → student proposes → accept → contract exists
- [ ] Fund → submit → approve → balances move per §9; invoice downloadable
- [ ] Withdraw below minimum rejected; above balance rejected
- [ ] Suspend user → login blocked; audit log entry exists
- [ ] Resolve dispute with each resolution; ledger stays balanced
- [ ] `npm test` green + Postman collection exported

**Questions?** Every rule above maps to an existing frontend screen — when in doubt, match what the UI already shows.

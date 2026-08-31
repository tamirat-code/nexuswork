# API

REST API for the NexusWork backend (`apps/backend`). Full endpoint-by-endpoint
reference is in [`reference.md`](./reference.md); auth-specific detail (token
lifecycle, MFA, cookies) is in [`auth-api.md`](./auth-api.md).

## Conventions

- **Base URL / prefix**: all versioned routes are mounted under `/v1`
  (`appConfig.apiPrefix`, `apps/backend/src/config/env.js`). Three routes live
  outside `/v1`: `GET /health`, `GET /ready`, and `GET /.well-known/nexuswork-issuer-key`
  (defined directly in `app.js`), plus `/webhooks/*` (mounted before the JSON
  body parser so Stripe/Chapa signatures can be verified against the raw body).
- **Response envelope**: handlers return `{ success: true, data, ... }` on
  success. Errors always return `{ success: false, message, code? }` — see
  `middleware/error.middleware.js`. Thrown `AppError` subclasses
  (`NotFoundError` → 404, `ForbiddenError` → 403, `ValidationError` → 400,
  from `shared/exceptions/AppError.js`) set the status; anything else becomes
  a generic `500` with the message suppressed.
- **Auth**: JWT is issued at login/register and read via `requireAuth`
  (`middleware/auth.middleware.js`) from an `Authorization: Bearer` header or
  an httpOnly cookie, depending on client. A CSRF guard (`csrfGuard`, from the
  auth module) runs on every request before route dispatch. Endpoints that
  need a role are gated with `requireRole(...ROLES)`
  (`middleware/role.middleware.js`); endpoints that need a verified email are
  gated with `requireEmailVerified` (`middleware/verification.middleware.js`).
- **Validation**: request bodies/params are validated with Zod schemas from
  `shared/validators/schemas.js` via `validateBody`/`validateParams`
  (`shared/validators/ZodValidator.js`). A failed validation returns `400`
  with per-field messages.
- **Pagination**: list endpoints accept `?page=&limit=` and respond with
  `{ data, pagination: { page, limit, total, pages } }`; defaults and the max
  page size are in `shared/constants/pagination.constants.js`.
- **Rate limiting**: a global limiter (300 req / 15 min / IP) applies to all
  `/v1` traffic. Tighter limiters apply to login (10/15min, keyed by email),
  verification-email resends (3/15min, keyed by user), and meeting actions
  (60/15min). See `middleware/rateLimiter.middleware.js`.
- **File uploads**: `POST /v1/files/upload` (multipart, field name `file`)
  is the single upload entry point; `files.upload.js` configures `multer` and
  `file-scanner.js` does basic content/type validation before persisting.
  Files are stored via the configured storage backend (S3 or local disk — see
  `shared/utils/s3.client.js` / `private-storage.client.js`) and served back
  through `GET /v1/files/content/:id`, which enforces the same ownership/
  relationship checks as the rest of the API rather than serving a public URL.
- **Realtime**: Socket.IO runs alongside the REST API (`src/websocket/`) with
  authenticated namespaces for contracts, meetings, and notifications — see
  the [Architecture](../architecture/README.md) doc.

## Modules

| Module | Mount | Summary |
| --- | --- | --- |
| Auth | `/v1/auth` | register/login, Google OAuth, MFA, password reset, email verification |
| Users | `/v1/users` | current-user profile, avatar, language preference |
| Students | `/v1/students` | student profile CRUD + public listing/lookup |
| Clients | `/v1/clients` | client org profile, org verification, additional posters |
| Universities | `/v1/universities` | university directory, staff self-service, admin create |
| Verifications | `/v1/verifications` | student identity verification, public credential verification, skill certification requests |
| Staff verifications | `/v1/staff-verifications` | university-staff identity verification |
| Categories | `/v1/categories` | project category catalog (admin-managed) |
| Skills | `/v1/skills` | skill catalog (admin-managed) |
| Projects | `/v1/projects` | project posting, listing, search |
| Proposals | `/v1/proposals` | student bids, client accept/reject, CV view tracking |
| Contracts | `/v1/contracts` | contract review/signature |
| Milestones | `/v1/milestones` | fund → start → submit → approve → release lifecycle |
| Submissions | `/v1/submissions` | milestone deliverable review/revision |
| Files | `/v1/files` | upload/download/delete for all attachment types |
| Payments | `/v1/payments` | payment history (Stripe/Chapa side-effects live in milestones/wallets/webhooks) |
| Wallets | `/v1/wallets` | payout account (Stripe Connect/Chapa), balance, withdrawals |
| Invoices | `/v1/invoices` | invoice generation, PDF/CSV download |
| Reviews | `/v1/reviews` | post-contract ratings and reputation |
| Disputes | `/v1/disputes` | milestone dispute open/resolve |
| Messaging | `/v1/messaging` | per-contract chat |
| Notifications | `/v1/notifications` | in-app notification feed |
| Portfolios | `/v1/portfolios` | portfolio items, milestone-derived items with client consent |
| Learning | `/v1/learning` | learning resource catalog (admin-managed) |
| Search | `/v1/search` | cross-entity text search |
| Recommendations | `/v1/recommendations` | AI/heuristic project matching, career guidance, price suggestion |
| Analytics | `/v1/analytics` | event tracking, platform/personal/university dashboards |
| Admin | `/v1/admin` | platform-wide dashboard, user and dispute administration |
| Audit logs | `/v1/audit-logs` | append-only audit trail read/flag |
| Health | `/v1/health` | readiness/liveness detail (distinct from the top-level `/health`) |
| Meetings | `/v1/meetings` | scheduling and WebRTC signaling handshake for video calls |
| Webhooks | `/webhooks` (not versioned) | Stripe and Chapa payment provider callbacks |

See [`reference.md`](./reference.md) for the full method/path/auth table per module.

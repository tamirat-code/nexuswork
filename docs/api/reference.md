# API reference

Method/path/auth reference for every route, read directly from each module's
`*.routes.js`. "Auth" column: **public** = no token required, **auth** =
`requireAuth` only, or a specific role list. "+verified" means
`requireEmailVerified` also applies. All paths are relative to `/v1` unless
marked **(unversioned)**.

## Auth — `/v1/auth`
Full detail in [`auth-api.md`](./auth-api.md).

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | public | |
| POST | `/login` | public | rate-limited (10/15min per email) |
| POST | `/google` | public | Google OAuth id-token exchange, rate-limited |
| POST | `/mfa/setup/initiate` | auth | issues a pending TOTP secret |
| POST | `/mfa/setup` | public\* | confirms setup with a 6-digit code; rate-limited |
| POST | `/mfa/verify` | public\* | verifies MFA during login; rate-limited |
| GET | `/csrf` | public | issues a CSRF token for the double-submit cookie pattern |
| GET | `/me` | auth | |
| POST | `/logout` | auth | |
| PATCH | `/password` | auth | change password while logged in |
| POST | `/password/forgot` | public | |
| POST | `/password/reset` | public | |
| POST | `/verify-email` | public | consumes the emailed verification token |
| POST | `/resend-verification` | auth | rate-limited (3/15min per user) |

\* MFA setup/verify don't carry `requireAuth` on the route itself because they
complete an in-progress login/setup flow using a short-lived token in the body.

## Users — `/v1/users`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/me` | auth |
| PATCH | `/me` | auth |
| PATCH | `/me/preferences` | auth — body restricted to `preferred_language ∈ {en,am,af}` |
| PATCH | `/me/avatar` | auth |
| DELETE | `/me/avatar` | auth |
| GET | `/:id` | auth |

## Students — `/v1/students`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public — list |
| GET | `/me` | student |
| PATCH | `/me` | student |
| GET | `/:id` | public — declared after `/me` so `"me"` is never matched as `:id` |

## Clients — `/v1/clients`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public — list |
| GET | `/me` | client |
| PATCH | `/me` | client |
| POST | `/me/verification` | client — submit org verification |
| GET | `/verifications` | admin |
| PATCH | `/verifications/:userId/review` | admin |
| POST | `/me/posters` | client — add an additional posting user |
| DELETE | `/me/posters/:userId` | client |

## Universities — `/v1/universities`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public |
| GET | `/mine` | university_staff |
| POST | `/` | admin |

## Verifications — `/v1/verifications`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/credentials/verify` | public — verify a signed credential payload |
| GET | `/credentials/:id/verify` | public — verify by credential id |
| POST | `/` | auth — submit student identity verification |
| GET | `/mine` | auth |
| GET | `/mine/:id/credential/card` | auth — image/PDF credential card export |
| GET | `/mine/:id/credential` | auth — signed credential JSON export |
| POST | `/skill-requests` | student — request university certification of one skill |
| GET | `/skill-requests/mine` | student |
| GET | `/skill-requests/queue` | university_staff, admin |
| PATCH | `/skill-requests/:id/review` | university_staff, admin |
| GET | `/stats` | admin, university_staff |
| GET | `/` | admin, university_staff — full queue |
| PATCH | `/:id/review` | auth — role/ownership enforced in the service layer |

## Staff verifications — `/v1/staff-verifications`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/` | auth |
| GET | `/mine` | auth |
| GET | `/stats` | admin |
| GET | `/` | admin |
| PATCH | `/:id/review` | admin |

## Categories — `/v1/categories`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public |
| GET | `/:id` | public |
| POST | `/` | admin |
| PUT | `/:id` | admin |
| DELETE | `/:id` | admin |

## Skills — `/v1/skills`
Same shape as categories: `GET /`, `GET /:id` public; `POST /`, `PATCH /:id`,
`DELETE /:id` admin-only.

## Projects — `/v1/projects`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public — list/search |
| GET | `/:id` | public |
| POST | `/` | client +verified |
| PATCH | `/:id` | client +verified — ownership enforced in the service layer |

## Proposals — `/v1/proposals`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/` | student +verified |
| GET | `/` | student — own proposals |
| GET | `/commission-preview` | student — preview commission before submitting |
| GET | `/incoming` | client, admin |
| GET | `/project/:projectId` | client, admin |
| POST | `/:id/accept` | client, admin |
| POST | `/:id/cv-viewed` | client, admin — marks CV as viewed (unlocks contact info per privacy rules) |
| POST | `/:id/reject` | client, admin |

## Contracts — `/v1/contracts`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | auth — own contracts |
| GET | `/:id` | auth — party-only |
| POST | `/:id/review` | auth — acknowledge current terms version |
| POST | `/:id/sign` | auth +verified |

## Milestones — `/v1/milestones`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/contract/:contractId` | client, admin +verified |
| GET | `/contract/:contractId` | auth |
| POST | `/fund/confirm` | client, admin +verified — Stripe post-checkout confirmation; declared before `/:id` |
| GET | `/:id` | auth |
| POST | `/:id/fund` | client, admin +verified |
| POST | `/:id/start` | student +verified |
| POST | `/:id/submit` | student +verified |
| POST | `/:id/approve` | client, admin +verified |
| POST | `/:id/release` | client, admin +verified — retry a failed release |

## Submissions — `/v1/submissions`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/milestone/:milestoneId` | auth |
| POST | `/:id/request-revision` | auth — client side |
| POST | `/milestone/:milestoneId/approve` | auth — client side |

## Files — `/v1/files`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/upload` | auth — multipart, field `file` |
| GET | `/contract/:contractId` | auth |
| GET | `/content/:id` | auth — streams the file, ownership/relationship-checked |
| GET | `/:id` | auth — metadata |
| DELETE | `/:id` | auth |

## Payments — `/v1/payments`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | auth — own payment history |

Payment *creation* happens as a side effect of milestone funding/release
(`/v1/milestones/:id/fund`, `/approve`) and wallet withdrawals, not through a
direct payments-create endpoint.

## Wallets — `/v1/wallets`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/me` | auth |
| GET | `/me/payout-status` | student |
| GET | `/me/transactions` | student |
| POST | `/me/connect` | student +verified — Stripe Connect onboarding link |
| PUT | `/me/chapa-payout` | student +verified — save Chapa bank payout details |
| POST | `/me/withdrawals` | student +verified |

## Invoices — `/v1/invoices`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/` | auth |
| GET | `/` | auth |
| GET | `/:id/download` | auth — PDF/CSV, declared before `/:id` |
| GET | `/:id` | auth |
| PATCH | `/:id` | auth — status transition |

## Reviews — `/v1/reviews`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/contract/:contractId` | auth |
| GET | `/user/:userId` | public |
| GET | `/user/:userId/reputation` | public — aggregate rating |

## Disputes — `/v1/disputes`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/milestone/:milestoneId` | auth |
| GET | `/` | admin — open queue |
| GET | `/mine` | auth |
| GET | `/:id/evidence` | auth |
| POST | `/:id/resolve` | admin |

## Messaging — `/v1/messaging`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/contract/:contractId` | auth |
| GET | `/contract/:contractId` | auth — paginated |

Real-time delivery also happens over the `/contracts` Socket.IO namespace;
these REST routes are the persisted history.

## Notifications — `/v1/notifications`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | auth |
| PATCH | `/read-all` | auth |
| PATCH | `/:id/read` | auth |

## Portfolios — `/v1/portfolios`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/` | auth |
| POST | `/from-milestone/:milestoneId` | auth — seed an item from completed paid work |
| GET | `/milestone/:milestoneId/consent` | auth |
| PATCH | `/:id/consent` | auth — client grants/denies showcase consent |
| GET | `/mine` | auth |
| GET | `/user/:userId` | public |
| GET | `/:id` | public |
| PATCH | `/:id` | auth |
| DELETE | `/:id` | auth |

## Learning — `/v1/learning`
Same admin-catalog shape as categories/skills: `GET /`, `GET /:id` public;
`POST /`, `PATCH /:id`, `DELETE /:id` admin-only.

## Search — `/v1/search`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public |

## Recommendations — `/v1/recommendations`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/me` | student — project matches |
| GET | `/career` | student — career-path guidance |
| GET | `/project/:projectId/students` | client, admin — matched candidates (project-owner/org-member/admin enforced in the service) |
| GET | `/price-suggestion` | client, admin |

## Analytics — `/v1/analytics`
| Method | Path | Auth |
| --- | --- | --- |
| POST | `/events` | auth — client-side event tracking |
| GET | `/platform` | admin |
| GET | `/me` | auth — personal dashboard |
| GET | `/university/mine` | university_staff |
| GET | `/university/:universityId` | university_staff, admin |

## Admin — `/v1/admin`
All routes require `requireAuth`; role is enforced inside `admin.controller.js`.

| Method | Path |
| --- | --- |
| GET | `/dashboard` |
| GET | `/users` |
| GET | `/users/:userId` |
| PATCH | `/users/:userId/suspend` |
| PATCH | `/users/:userId/restore` |
| DELETE | `/users/:userId` |
| PATCH | `/users/:userId/role` |
| GET | `/disputes` |
| PATCH | `/disputes/:disputeId/resolve` |

## Audit logs — `/v1/audit-logs`
All routes require `requireAuth`; role/scope enforced in the controller.

| Method | Path |
| --- | --- |
| GET | `/` |
| GET | `/history/:entity_type/:entity_id` |
| GET | `/summary` |
| PATCH | `/:id/flag` |

## Health — `/v1/health`
| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | public |

Distinct from the top-level, unversioned `GET /health` (liveness only) and
`GET /ready` (checks `mongoose.connection.readyState`) defined in `app.js`.

## Meetings — `/v1/meetings`
See [`meetings-and-i18n.md`](../meetings-and-i18n.md) for the full design.

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/` | auth — rate-limited |
| GET | `/contract/:contractId` | auth |
| GET | `/:id` | auth |
| PATCH | `/:id` | auth — rate-limited |
| POST | `/:id/start` | auth — rate-limited |
| POST | `/:id/end` | auth — rate-limited |
| POST | `/:id/join` | auth — rate-limited |
| POST | `/:id/leave` | auth — rate-limited |
| DELETE | `/:id` | auth — rate-limited (cancellation) |

## Webhooks — `/webhooks` (unversioned, outside `/v1`)
Mounted with `express.raw()` **before** the JSON body parser so provider
signatures can be verified against the exact raw payload.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/stripe` | Stripe event webhook |
| GET | `/chapa/callback` | Chapa browser return redirect |
| POST | `/chapa` | Chapa server-to-server webhook |

## Well-known / unversioned utility routes
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | liveness |
| GET | `/ready` | readiness (Mongo connection state) |
| GET | `/.well-known/nexuswork-issuer-key` | public key used to verify exported skill/identity credentials |

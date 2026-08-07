# Auth API Reference

Base URL: `{{base_url}}/auth` (e.g. `http://localhost:5000/api/auth`)

All request/response bodies are JSON. Authenticated routes require:
```
Authorization: Bearer <token>
```

---

## POST /register

Create a new account. Only `student` and `client` roles are allowed through this endpoint — `university_staff` and `admin` accounts are provisioned separately, not through public signup.

**Body**
```json
{
  "email": "hanna@example.com",
  "password": "Password123!",
  "name": "Hanna Beyene",
  "role": "student"
}
```

**Success — 201**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "email": "hanna@example.com",
      "name": "Hanna Beyene",
      "role": "student",
      "email_verified": false
    }
  }
}
```

**Errors**
| Status | Cause |
|---|---|
| 400 | Missing required field, or `role` not `student`/`client` |
| 409 | Email already registered |

Side effects: creates a `Wallet`, creates a `StudentProfile` if role is `student`, sends a verification email, sends a welcome email (best-effort — failure doesn't block registration).

---

## POST /login

**Body**
```json
{
  "email": "hanna@example.com",
  "password": "Password123!"
}
```

**Success — 200** — same shape as register's `data`.

**Errors**
| Status | Cause |
|---|---|
| 401 | Invalid email or password |
| 423 | Account temporarily locked (5 failed attempts within the lockout window) — message includes minutes remaining |

Rate limited: max 10 attempts per 15 minutes, keyed by email (or IP if no email in body).

---

## GET /me
**Requires auth.**

**Success — 200**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "hanna@example.com",
    "name": "Hanna Beyene",
    "role": "student",
    "email_verified": true
  }
}
```

**Errors**: 401 if token missing, invalid, expired, or revoked (logged out).

---

## POST /logout
**Requires auth.**

Revokes the current token (adds its `jti` to the revoked-tokens list; it stops working immediately, even before its natural expiry).

**Success — 200**
```json
{ "success": true, "data": { "loggedOut": true } }
```

---

## PATCH /password
**Requires auth.** Change password while logged in.

**Body**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Success — 200**
```json
{ "success": true, "data": { "changed": true } }
```

**Errors**: 400 if `currentPassword` is wrong.

---

## POST /password/forgot

Request a password reset email. Always returns the same generic success message, whether or not the email is registered — this is intentional, to avoid leaking which emails exist in the system.

**Body**
```json
{ "email": "hanna@example.com" }
```

**Success — 200**
```json
{
  "success": true,
  "data": { "message": "If that email is registered, a reset link has been sent." }
}
```

If the email exists, a reset link is emailed:
```
{CLIENT_URL}/reset-password?token=<raw_token>
```
Token expires in **15 minutes**, single-use.

---

## POST /password/reset

**Body**
```json
{
  "token": "<raw_token_from_email>",
  "newPassword": "NewPassword456!"
}
```

**Success — 200**
```json
{ "success": true, "data": { "reset": true } }
```

**Errors**: 400 if token is invalid, expired, or already used. On success, also clears any account lockout state.

---

## POST /verify-email

**Body**
```json
{ "token": "<raw_token_from_email>" }
```

**Success — 200**
```json
{ "success": true, "data": { "verified": true } }
```

**Errors**: 400 if token is invalid or expired. Token expires in **24 hours**.

---

## POST /resend-verification
**Requires auth.**

Re-sends the verification email, invalidating any previously issued verification token.

**Success — 200**
```json
{ "success": true, "data": { "sent": true } }
```

**Errors**: 400 if the account's email is already verified.

---

## Common error shape

All errors follow:
```json
{ "success": false, "message": "Human-readable description" }
```

## Notes for frontend integration

- Store the `token` from register/login; attach as `Authorization: Bearer <token>` on every authenticated request.
- `/verify-email` and `/reset-password` tokens arrive **only via email**, never in an API response — the frontend pages for these routes must read `token` from the URL query string (`?token=...`) and POST it to the corresponding endpoint.
- A `401` from any authenticated route (expired, invalid, or revoked token) should trigger a client-side logout and redirect to `/login`.
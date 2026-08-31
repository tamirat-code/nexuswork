# User manuals

End-user guides, one per role, written from the actual pages in
`apps/frontend/src/app/router/index.jsx` and the API each page calls. Every
account starts as a **visitor**, becomes exactly one of **student**, **client**,
or **university_staff** at registration (`User.role`), and **admin** accounts
are provisioned separately (not self-registrable).

- [Student guide](./student-guide.md)
- [Client guide](./client-guide.md)
- [University staff guide](./university-staff-guide.md)
- [Administrator guide](./admin-guide.md)

## Shared, role-independent pages

These are available to any signed-in user regardless of role:

| Page | Path | What it's for |
| --- | --- | --- |
| Dashboard | `/dashboard` | Role-specific landing page (content differs per role — see each guide) |
| Profile | `/profile`, `/profile/:id` | Your own profile (editable) or another user's public profile |
| Settings | `/settings` | Language, notification preferences, MFA, password |
| Notifications | `/notifications` | In-app notification feed |
| Messages | `/chat`, `/chat/:conversationId` | Per-contract messaging |
| Meetings | `/meetings`, `/meetings/:meetingId` | Scheduled video calls tied to a contract |
| Search | `/search` | Cross-entity search (projects, students, skills) |
| Skills / Learning | `/skills`, `/learning` | Browse the skill and learning-resource catalog |
| Universities | `/universities` | Public university directory |
| Verify a credential | `/verify-credential` | Publicly check a NexusWork-issued skill/identity credential |

## Signed-out pages

`/` (landing), `/projects` (public project browse), `/login`, `/register`,
`/forgot-password`, `/reset-password`, `/verify-email`, `/terms`, `/privacy`.

## Account setup, common to every role

1. **Register** at `/register` with an email, password, name, and role.
2. **Verify your email** — a link is sent; `/verify-email` consumes it. Some
   actions (posting a project, submitting a proposal, funding or releasing a
   milestone, withdrawing funds) require a verified email
   (`requireEmailVerified` — see [`api/README.md`](../api/README.md)).
3. **Optional: enable MFA** at `/mfa/setup` (TOTP — use an authenticator app).
   Once enabled, login prompts for a code at `/mfa/verify`.
4. **Google sign-in** is available at login/register as an alternative to a
   password, but does not skip role-specific identity verification below.

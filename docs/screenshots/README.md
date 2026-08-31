# Screenshots

UI screenshots for docs and reports. None are checked in yet — this repo
snapshot has no image captures under this folder.

## What to capture

For the [user manuals](../user-manuals/README.md), one screenshot per major
step is usually enough. Suggested set, matched to the actual routes:

| Role | Screens |
| --- | --- |
| Student | `/register` (role picker), `/profile` (verification submission), `/projects` (browse), a proposal form, `/contracts/:id` (signature step), a milestone page (fund → submit → approve states), `/wallet` (payout setup), `/portfolios` |
| Client | `/projects/new`, a proposal-review list with the CV-view action, `/contracts/:id`, a milestone funding dialog (Stripe/Chapa checkout), the portfolio-consent prompt |
| University staff | `/verifications` (both queues — identity and skill certification), `/analytics` |
| Admin | `/admin/users`, `/admin/disputes`, `/admin/analytics`, an audit-log entry |

## Naming convention

`<role>-<page-slug>-<state>.png`, e.g. `student-milestone-funded.png`,
`client-project-new-form.png`. Reference them from the relevant guide with a
relative path once added, e.g. `![Funding a milestone](../screenshots/client-milestone-fund-dialog.png)`.

## How to capture

Run the app locally (`docker compose up --build`, see
[`deployment/README.md`](../deployment/README.md)), seed demo data
(`npm run seed` in `apps/backend`), and log in as each seeded role
(`src/seed/users.seed.js` has the demo accounts) to reach these screens
without needing real verification/payment credentials.

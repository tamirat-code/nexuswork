# NexusWork Backend

Express + MongoDB API, organized as one module per domain under `src/modules`.
Each module owns its own model/service/controller/routes — see `src/api/v1/routes.js`
for how they're mounted.

## Setup
```bash
cp .env.example .env   # set MONGO_URI, JWT_SECRET, and (optionally) AI_API_KEY
npm install
npm run dev
```

## Module status

Fully implemented: auth, users, students, clients, universities, projects, proposals,
contracts, milestones, submissions, payments, wallets, reviews, disputes, messaging,
recommendation (AI-assisted, falls back to skill-overlap scoring if no AI key is set), health.

Scaffolded (model + placeholder route, not yet implemented): verifications, categories,
skills, files, invoices, notifications, portfolios, learning, search, analytics, admin,
audit-logs.

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

**Fully implemented (30):**
auth, users, students, clients, universities, projects, proposals, contracts, milestones, 
submissions, payments, wallets, reviews, disputes, messaging, notifications, recommendation 
(AI-assisted, falls back to skill-overlap scoring if no AI key is set), portfolios, files, 
skills, categories, learning, search, analytics, health, verifications, invoices, admin, 
audit-logs, webhooks.

**Special notes:**
- AI Recommendation module falls back to skill-overlap scoring if no AI API key is configured
- Payment processing requires Stripe configuration (see config/payment.config.js)
- Real-time messaging uses Socket.io (see config/socket.config.js)
- Admin module provides user management, dispute resolution, and dashboard
- Audit-logs module provides append-only logging for financial and administrative actions

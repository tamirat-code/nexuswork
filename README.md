# NexusWork

A web-based student freelance marketplace and skill-management system:
university-verified student identity and skills, project posting and
proposals, milestone-based escrow contracts, AI-assisted matching, and
university-facing employment/skill analytics.

Originally documented as an academic project
(`Design and Development of a Web-Based Student Freelance Marketplace and
Skill Management System`, University of Gondar, Department of Computer
Science, August 2026). The `docs/` folder in this repo is the living
engineering documentation, generated from and kept in sync with the actual
codebase — see [Documentation](#documentation) below for how the two relate.

## Stack

- **Backend**: Node.js / Express, MongoDB (Mongoose), Socket.IO, Zod
  validation, JWT auth with TOTP MFA, Stripe + Chapa payment providers,
  S3-compatible file storage, Resend email.
- **Frontend**: React 18 (Vite), TanStack Query, Zustand, Tailwind CSS +
  Radix/shadcn UI, react-hook-form + Zod, i18next (English, Amharic, Afaan
  Oromoo), Socket.IO client, Stripe Elements.
- **Infra**: Docker Compose (single-node MongoDB replica set required for
  transactions), nginx for the built frontend, GitHub Actions CI.

## Quick start

```bash
docker compose up --build
```

Backend on `http://localhost:5000`, frontend on `http://localhost:5173`. See
[`docs/deployment/README.md`](./docs/deployment/README.md) for environment
variables, production deployment, and database bootstrap/seeding, or run
each app directly:

```bash
cd apps/backend && cp .env.example .env && npm install && npm run dev
cd apps/frontend && npm install && npm run dev
```

## Repository layout

```
apps/
  backend/    Express API, Socket.IO, background jobs — one module per domain under src/modules/
  frontend/   React SPA (Vite) — one feature per domain under src/features/
docs/         Engineering documentation (see below)
infrastructure/  nginx config, deployment scripts, Docker notes
```

## Documentation

| Doc | Covers |
| --- | --- |
| [`docs/architecture/`](./docs/architecture/README.md) | System components, data flow, the phased financial-architecture design |
| [`docs/api/`](./docs/api/README.md) | REST API reference, module-by-module, plus auth-flow detail |
| [`docs/database/`](./docs/database/README.md) | ER diagram and full field-by-field data dictionary (34 collections) |
| [`docs/uml/`](./docs/uml/README.md) | Use-case, activity, sequence, class, component, and deployment diagrams |
| [`docs/requirements/`](./docs/requirements/README.md) | Functional/non-functional requirements, matched against actual implementation status |
| [`docs/user-manuals/`](./docs/user-manuals/README.md) | End-user guides per role (student, client, university staff, admin) |
| [`docs/testing/`](./docs/testing/README.md) | Test suite inventory and how to run it |
| [`docs/deployment/`](./docs/deployment/README.md) | Local/production deployment, migrations, and the [production-readiness runbook](./docs/deployment/production-readiness.md) |
| [`docs/security/`](./docs/security/phase-0-authorization-matrix.md) | Endpoint-level authorization matrix |
| [`docs/meetings-and-i18n.md`](./docs/meetings-and-i18n.md) | The in-app video-meeting feature and internationalization setup |
| [`docs/reports/`](./docs/reports/README.md), [`docs/meeting-notes/`](./docs/meeting-notes/README.md), [`docs/screenshots/`](./docs/screenshots/README.md) | Process artifacts — templates, not generated content |

The database, API, architecture, and UML docs are generated directly from the
current code (models, routes, controllers) — if they and the code ever
disagree, trust the code and treat the doc as due for a refresh. The
requirements doc is the one place that explicitly tracks where the
implementation matches, diverges from, or falls short of the original
project proposal.

## License

MIT — see [`LICENSE`](./LICENSE).

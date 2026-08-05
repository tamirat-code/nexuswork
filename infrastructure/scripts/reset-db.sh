#!/usr/bin/env bash
# Drops and reseeds the local MongoDB database. Local dev only — do not point at production.
set -euo pipefail
cd "$(dirname "$0")/../../apps/backend"
node -e "require('mongoose').connect(process.env.MONGO_URI).then(c => c.connection.dropDatabase()).then(() => process.exit(0))"
npm run seed

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { appConfig } from "./config/app.config.js";
import { corsConfig } from "./config/cors.config.js";
import { requestLogger } from "./middleware/logging.middleware.js";
import { requestContext } from "./middleware/request-context.middleware.js";
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { v1Router } from "./api/v1/index.js";
import { WebhooksRoutes } from "./modules/webhooks/index.js";
import { getCredentialIssuerPublicKey } from "./modules/verifications/credential-signing.js";
import { csrfGuard } from "./modules/auth/auth.cookies.js";

const app = express();

// Render sits behind a reverse proxy. Trust the first proxy hop so
// express-rate-limit can distinguish users by their forwarded client IP.
app.set("trust proxy", 1);

app.use(requestContext);

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  // The frontend and API are deployed on different origins. CORS remains
  // restricted to the configured allowlist, while CORP must permit the
  // browser to consume authenticated API/file responses cross-origin.
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors(corsConfig));
app.use(csrfGuard);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));


app.get("/ready", (req, res) => {
 
  try {
 
    const ready = mongoose.connection?.readyState === 1; // 1 == connected
    return ready 
    ? res.status(200).json({ ready: true }) 
    : res.status(503).json({ ready: false });
  } catch (err) {
    return res.status(503).json({ ready: false });
  }
});

app.get("/.well-known/nexuswork-issuer-key", (req, res) => {
  res.json(getCredentialIssuerPublicKey());
});

app.use("/webhooks", express.raw({ type: "application/json" }), WebhooksRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.use(appConfig.apiPrefix, v1Router);

app.use(notFound);
app.use(errorHandler);

export default app;

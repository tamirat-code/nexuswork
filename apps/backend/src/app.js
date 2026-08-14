import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { appConfig } from "./config/app.config.js";
import { corsConfig } from "./config/cors.config.js";
import { storageConfig } from "./config/storage.config.js";
import { requestLogger } from "./middleware/logging.middleware.js";
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { v1Router } from "./api/v1/index.js";
import { WebhooksRoutes } from "./modules/webhooks/index.js";

const app = express();

app.use(helmet());
app.use(cors(corsConfig));


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

app.use("/webhooks", express.raw({ type: "application/json" }), WebhooksRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(storageConfig.absoluteUploadDir)
);

app.use(appConfig.apiPrefix, v1Router);

app.use(notFound);
app.use(errorHandler);

export default app;
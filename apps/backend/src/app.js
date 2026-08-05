import express from "express";
import cors from "cors";
import helmet from "helmet";

import { appConfig } from "./config/app.config.js";
import { corsConfig } from "./config/cors.config.js";
import { requestLogger } from "./middleware/logging.middleware.js";
import { rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import { v1Router } from "./api/v1/index.js";

const app = express();

app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);
app.use(rateLimiter);

app.use(appConfig.apiPrefix, v1Router);

app.use(notFound);
app.use(errorHandler);

export default app;

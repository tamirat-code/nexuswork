import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/database.config.js";
import { appConfig } from "./config/app.config.js";
import { initSocket } from "./websocket/index.js";
import { logger } from "./shared/logger/logger.js";

async function start() {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(appConfig.port, () => {
    logger.info(`NexusWork API listening on port ${appConfig.port}`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server:", err.message);
  process.exit(1);
});

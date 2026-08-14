import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/database.config.js";
import { appConfig } from "./config/app.config.js";
import { initSocket } from "./websocket/index.js";
import { logger } from "./shared/logger/logger.js";
import { validateEnv } from "./config/env.validation.js";


validateEnv();

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = initSocket(server);

  server.listen(appConfig.port, () => {
    logger.info(`NexusWork API listening on port ${appConfig.port}`);
  });

  
  async function shutdown(signal) {
    try {
      logger.info(`Received ${signal}. Shutting down gracefully.`);
     
      server.close((err) => {
        if (err) logger.error("Error closing server:", err.message);
      });

      
      try {
        if (io && typeof io.close === "function") {
          await new Promise((resolve) => io.close(resolve));
        }
      } catch (e) {
        logger.error("Error closing socket.io:", e.message);
      }

     
      try {
        
        const mongoose = require("mongoose");
        await mongoose.disconnect();
      } catch (e) {
        logger.error("Error disconnecting mongoose:", e.message);
      }

      logger.info("Shutdown complete. Exiting.");
      process.exit(0);
    } catch (e) {
      logger.error("Error during shutdown:", e.message);
      process.exit(1);
    }
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error("Failed to start server:", err.message);
  process.exit(1);
});

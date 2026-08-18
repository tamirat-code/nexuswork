import { socketAuth } from "../socket.middleware.js";
import { logger } from "../../shared/logger/logger.js";

export function registerNotificationNamespace(io) {
  const nsp = io.of("/notifications");

  // Authenticate the socket using the same JWT as the REST API.
  nsp.use(socketAuth);

  nsp.on("connection", (socket) => {
    const userId = String(socket.userId || "");

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // Each user gets their own private notification room.
    socket.join(`user:${userId}`);

    logger.info(
      `[socket] notification connection established for user ${userId}`
    );

    socket.emit("notification:connected", {
      userId,
    });

    socket.on("disconnect", (reason) => {
      logger.info(
        `[socket] notification disconnected for user ${userId}: ${reason}`
      );
    });
  });
}
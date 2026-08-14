import { socketAuth } from "../socket.middleware.js";
import { sendMessage } from "../../modules/messaging/messaging.service.js";
import { logger } from "../../shared/logger/logger.js";


export function registerContractNamespace(io) {
  const nsp = io.of("/contracts");
  nsp.use(socketAuth);
  nsp.on("connection", (socket) => {
    socket.on("join", (contractId) => socket.join(`contract:${contractId}`));

    
    socket.on("message:send", async (payload) => {
      try {
        const message = await sendMessage(payload.contract_id, socket.userId, {
          body: payload.body,
          attachments: payload.attachments || [],
        });
        nsp.to(`contract:${payload.contract_id}`).emit("message:new", message);
      } catch (err) {
        logger.error("[socket] failed to send message:", err.message);
        socket.emit("message:error", { message: err.message });
      }
    });
  });
}

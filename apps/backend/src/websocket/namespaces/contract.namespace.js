import { socketAuth } from "../socket.middleware.js";
import { sendMessage } from "../../modules/messaging/messaging.service.js";
import { logger } from "../../shared/logger/logger.js";
import Contract from "../../modules/contracts/contracts.model.js";

export function registerContractNamespace(io) {
  const nsp = io.of("/contracts");
  nsp.use(socketAuth);
  nsp.on("connection", (socket) => {
    socket.on("join", async (contractId) => {
      try {
        const parse = await import("../../websocket/schemas/contract.schemas.js");
        const { joinSchema } = parse;
        const res = joinSchema.safeParse(contractId);
        if (!res.success) return socket.emit("join:error", { message: res.error.errors.map((e)=>e.message).join("; ") });

        const contract = await Contract.findById(res.data).select("client_id student_id");
        if (!contract) return socket.emit("join:error", { message: "Contract not found" });

        const userId = String(socket.userId || "");
        if (String(contract.client_id) !== userId && String(contract.student_id) !== userId) {
          return socket.emit("join:error", { message: "Forbidden" });
        }

        socket.join(`contract:${res.data}`);
        socket.emit("join:ok", { contractId: res.data });
      } catch (err) {
        logger.error("[socket] join error:", err.message);
        socket.emit("join:error", { message: err.message });
      }
    });

    socket.on("message:send", async (payload) => {
      try {
        const parse = await import("../../websocket/schemas/contract.schemas.js");
        const { messageSendSchema } = parse;
        const res = messageSendSchema.safeParse(payload);
        if (!res.success) return socket.emit("message:error", { message: res.error.errors.map((e)=>e.message).join("; ") });

        const message = await sendMessage(res.data.contract_id, socket.userId, {
          body: res.data.body,
          attachments: res.data.attachments || [],
        });
        
        socket.emit("message:sent", message);
      } catch (err) {
        logger.error("[socket] failed to send message:", err.message);
        socket.emit("message:error", { message: err.message });
      }
    });
  });
}

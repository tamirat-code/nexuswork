import { Server } from "socket.io";
import { socketConfig } from "../config/socket.config.js";
import { registerContractNamespace } from "./namespaces/contract.namespace.js";

// Real-time messaging/notifications (Section 3.10). Namespaces keep
// concerns separated instead of one giant io.on("connection") handler.
export function initSocket(httpServer) {
  const io = new Server(httpServer, socketConfig);
  registerContractNamespace(io);
  return io;
}

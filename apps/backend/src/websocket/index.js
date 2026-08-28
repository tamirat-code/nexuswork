import { Server } from "socket.io";
import { socketConfig } from "../config/socket.config.js";

import { registerContractNamespace } from "./namespaces/contract.namespace.js";
import { registerNotificationNamespace } from "./namespaces/notification.namespace.js";
import { registerMeetingNamespace } from "./namespaces/meeting.namespace.js";

import { setIO } from "./socket.registry.js";

export function initSocket(httpServer) {
  const io = new Server(httpServer, socketConfig);

  setIO(io);

  // Existing contract/message websocket.
  registerContractNamespace(io);

  registerNotificationNamespace(io);
  registerMeetingNamespace(io);

  return io;
}

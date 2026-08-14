import { Server } from "socket.io";
import { socketConfig } from "../config/socket.config.js";
import { registerContractNamespace } from "./namespaces/contract.namespace.js";
import { setIO } from "./socket.registry.js";


export function initSocket(httpServer) {
  const io = new Server(httpServer, socketConfig);
  setIO(io);
  registerContractNamespace(io);
  return io;
}

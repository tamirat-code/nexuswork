import { socketAuth } from "../socket.middleware.js";

// One room per contract so messages/typing indicators only reach the two parties.
export function registerContractNamespace(io) {
  const nsp = io.of("/contracts");
  nsp.use(socketAuth);
  nsp.on("connection", (socket) => {
    socket.on("join", (contractId) => socket.join(`contract:${contractId}`));
    socket.on("message:send", (payload) => {
      nsp.to(`contract:${payload.contract_id}`).emit("message:new", payload);
    });
  });
}

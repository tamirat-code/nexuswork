// Holds the Socket.IO server instance so non-websocket modules (e.g. the
// messaging service) can emit real-time events to connected clients.
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}

// Emit an event to everyone in a contract room (the two contract parties).
export function emitToContract(contractId, event, payload) {
  if (!ioInstance) return;
  ioInstance.of("/contracts").to(`contract:${contractId}`).emit(event, payload);
}
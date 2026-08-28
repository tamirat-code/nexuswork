
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}


export function emitToContract(contractId, event, payload) {
  if (!ioInstance) return;

  ioInstance
    .of("/contracts")
    .to(`contract:${contractId}`)
    .emit(event, payload);
}


export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId) return;

  ioInstance
    .of("/notifications")
    .to(`user:${String(userId)}`)
    .emit(event, payload);
}

export function emitToMeeting(roomId, event, payload) {
  if (!ioInstance || !roomId) return;
  ioInstance.of("/meetings").to(`meeting:${roomId}`).emit(event, payload);
}

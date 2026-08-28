import { socketAuth } from "../socket.middleware.js";
import Meeting from "../../modules/meetings/meetings.model.js";
import { canAccessMeeting } from "../../modules/meetings/meetings.service.js";

const room = (id) => `meeting:${id}`;
const valid = (value) => typeof value === "string" && value.length > 0 && value.length <= 200000;

export function registerMeetingNamespace(io) {
  const nsp = io.of("/meetings");
  nsp.use(socketAuth);
  nsp.on("connection", (socket) => {
    socket.on("meeting:join", async ({ room_id } = {}) => {
      if (!valid(room_id)) return socket.emit("meeting:error", { code: "INVALID_ROOM" });
      const meeting = await Meeting.findOne({ room_id });
      if (!meeting || !canAccessMeeting(meeting, socket.userId)) return socket.emit("meeting:error", { code: "MEETING_NOT_AUTHORIZED" });
      socket.join(room(room_id)); socket.data.meeting = meeting._id; socket.to(room(room_id)).emit("meeting:participant-joined", { userId: socket.userId });
    });
    socket.on("meeting:leave", async () => { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (!meeting) return; socket.to(room(meeting.room_id)).emit("meeting:participant-left", { userId: socket.userId }); socket.leave(room(meeting.room_id)); socket.data.meeting = null; });
    for (const event of ["webrtc:offer", "webrtc:answer", "webrtc:ice-candidate"]) socket.on(event, async (payload = {}) => {
      const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting);
      if (!meeting || !canAccessMeeting(meeting, socket.userId) || !valid(payload.targetUserId) || JSON.stringify(payload).length > 200000) return socket.emit("meeting:error", { code: "INVALID_SIGNAL" });
      const target = [...nsp.sockets.values()].find((candidate) => String(candidate.userId) === String(payload.targetUserId) && candidate.rooms.has(room(meeting.room_id)));
      if (target) target.emit(event, { ...payload, fromUserId: socket.userId });
    });
    for (const event of ["meeting:mute", "meeting:unmute", "meeting:camera-on", "meeting:camera-off"]) socket.on(event, async () => { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (meeting && canAccessMeeting(meeting, socket.userId)) socket.to(room(meeting.room_id)).emit(event, { userId: socket.userId }); });
    socket.on("disconnect", async () => { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (meeting) socket.to(room(meeting.room_id)).emit("meeting:participant-left", { userId: socket.userId }); });
  });
}

import { socketAuth } from "../socket.middleware.js";
import Meeting from "../../modules/meetings/meetings.model.js";
import { canAccessMeeting } from "../../modules/meetings/meetings.service.js";
import { logger } from "../../shared/logger/logger.js";

const room = (id) => `meeting:${id}`;
const valid = (value) => typeof value === "string" && value.length > 0 && value.length <= 200000;

export function registerMeetingNamespace(io) {
  const nsp = io.of("/meetings");
  nsp.use(socketAuth);
  nsp.on("connection", (socket) => {
    const safe = (event, handler) => socket.on(event, async (...args) => {
      try { await handler(...args); } catch (error) { logger.error("Meeting socket handler failed", error, { event, userId: socket.userId }); socket.emit("meeting:error", { code: "MEETING_CONNECTION_ERROR" }); }
    });
    safe("meeting:join", async ({ room_id } = {}) => {
      if (!valid(room_id)) return socket.emit("meeting:error", { code: "INVALID_ROOM" });
      const meeting = await Meeting.findOne({ room_id });
      if (!meeting || !canAccessMeeting(meeting, socket.userId)) return socket.emit("meeting:error", { code: "MEETING_NOT_AUTHORIZED" });
      const meetingRoom = room(room_id);
      const existingParticipants = [...nsp.sockets.values()]
        .filter((candidate) => candidate.id !== socket.id && candidate.rooms.has(meetingRoom))
        .map((candidate) => candidate.userId)
        .filter(Boolean);
      socket.join(meetingRoom);
      socket.data.meeting = meeting._id;
      // Notify both sides. This handles the race where a participant joins
      // before the host's Socket.IO room is ready, and also lets a reconnecting
      // socket restart negotiation with everyone already in the room.
      existingParticipants.forEach((userId) => socket.emit("meeting:participant-joined", { userId }));
      socket.to(meetingRoom).emit("meeting:participant-joined", { userId: socket.userId });
    });
    safe("meeting:leave", async () => { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (!meeting) return; const entry = meeting.participants.find((participant) => String(participant.user_id) === String(socket.userId)); if (entry) { entry.left_at = new Date(); await meeting.save(); } socket.to(room(meeting.room_id)).emit("meeting:participant-left", { userId: socket.userId }); socket.leave(room(meeting.room_id)); socket.data.meeting = null; });
    for (const event of ["webrtc:offer", "webrtc:answer", "webrtc:ice-candidate"]) safe(event, async (payload = {}) => {
      const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting);
      if (!meeting || !canAccessMeeting(meeting, socket.userId) || !valid(payload.targetUserId) || JSON.stringify(payload).length > 200000) return socket.emit("meeting:error", { code: "INVALID_SIGNAL" });
      const target = [...nsp.sockets.values()].find((candidate) => String(candidate.userId) === String(payload.targetUserId) && candidate.rooms.has(room(meeting.room_id)));
      if (target) target.emit(event, { ...payload, fromUserId: socket.userId });
    });
    for (const event of ["meeting:mute", "meeting:unmute", "meeting:camera-on", "meeting:camera-off"]) safe(event, async () => { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (meeting && canAccessMeeting(meeting, socket.userId)) socket.to(room(meeting.room_id)).emit(event, { userId: socket.userId }); });
    socket.on("disconnect", async () => { try { const meeting = socket.data.meeting && await Meeting.findById(socket.data.meeting); if (!meeting) return; const entry = meeting.participants.find((participant) => String(participant.user_id) === String(socket.userId)); if (entry && !entry.left_at) { entry.left_at = new Date(); await meeting.save(); } socket.to(room(meeting.room_id)).emit("meeting:participant-left", { userId: socket.userId }); } catch (error) { logger.error("Meeting disconnect handler failed", error, { userId: socket.userId }); } });
  });
}

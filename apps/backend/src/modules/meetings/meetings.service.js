import crypto from "node:crypto";
import Meeting from "./meetings.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { emitToMeeting } from "../../websocket/socket.registry.js";

const id = (v) => String(v?._id || v);
const isParty = (c, userId) => id(c.client_id) === id(userId) || id(c.student_id) === id(userId);
const participant = (userId, role) => ({ user_id: userId, role, joined_at: null, left_at: null });

async function context(meetingId, userId) {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw new NotFoundError("Meeting not found", "MEETING_NOT_FOUND");
  const contract = await Contract.findById(meeting.contract_id).select("client_id student_id status");
  if (!contract || !isParty(contract, userId)) throw new ForbiddenError("You are not authorized for this meeting", "MEETING_NOT_AUTHORIZED");
  return { meeting, contract };
}

async function audit(action, meeting, actor, previousState = null, newState = null, metadata = {}) {
  return recordEvent({ actor, eventType: `MEETING_${action.toUpperCase()}`, action: `meeting.${action.toLowerCase()}`, entityType: "meeting", entityId: meeting._id, previousState, newState, correlationId: crypto.randomUUID(), metadata });
}

export async function createMeeting({ contractId, user, title, description = "", scheduledStart, scheduledEnd = null, milestoneId = null }) {
  const contract = await Contract.findById(contractId).select("client_id student_id status");
  if (!contract) throw new NotFoundError("Contract not found", "CONTRACT_NOT_FOUND");
  if (!isParty(contract, user._id)) throw new ForbiddenError("You are not a party to this contract", "MEETING_NOT_AUTHORIZED");
  if (!["active"].includes(contract.status)) throw new ValidationError("Meetings require an active contract");
  if (milestoneId) {
    const milestone = await Milestone.findById(milestoneId).select("contract_id");
    if (!milestone || id(milestone.contract_id) !== id(contractId)) throw new ValidationError("Milestone does not belong to this contract");
  }
  const start = new Date(scheduledStart);
  const end = scheduledEnd ? new Date(scheduledEnd) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime())) || start <= new Date() || (end && end <= start)) throw new ValidationError(start <= new Date() ? "Meeting start must be in the future" : "Invalid meeting schedule");
  const meeting = await Meeting.create({ contract_id: contractId, milestone_id: milestoneId, created_by: user._id, host_user_id: user._id, title, description, scheduled_start: start, scheduled_end: end, room_id: crypto.randomBytes(24).toString("base64url"), participants: [participant(user._id, "host"), participant(id(user._id) === id(contract.client_id) ? contract.student_id : contract.client_id, "participant")] });
  await audit("CREATED", meeting, user, null, meeting.status, { contractId });
  const other = id(user._id) === id(contract.client_id) ? contract.student_id : contract.client_id;
  await createNotification({ userId: other, type: "meeting_created", title: "Meeting scheduled", body: `${title} has been scheduled.`, data: { meeting_id: meeting._id, action: "view_meeting" } });
  return meeting;
}

export async function getMeeting(meetingId, userId) { const { meeting } = await context(meetingId, userId); return meeting; }
export async function listMeetings(contractId, userId) {
  const contract = await Contract.findById(contractId).select("client_id student_id");
  if (!contract || !isParty(contract, userId)) throw new ForbiddenError("You are not a party to this contract", "MEETING_NOT_AUTHORIZED");
  return Meeting.find({ contract_id: contractId }).sort({ scheduled_start: 1 });
}
export async function updateMeeting(meetingId, user, updates) {
  const { meeting } = await context(meetingId, user._id);
  if (id(meeting.created_by) !== id(user._id)) throw new ForbiddenError("Only the meeting host can update it");
  if (["ended", "cancelled"].includes(meeting.status)) throw new ValidationError("This meeting can no longer be updated");
  const previous = meeting.status;
  for (const key of ["title", "description"]) if (updates[key] !== undefined) meeting[key] = updates[key];
  if (updates.scheduled_start !== undefined) meeting.scheduled_start = new Date(updates.scheduled_start);
  if (updates.scheduled_end !== undefined) meeting.scheduled_end = updates.scheduled_end ? new Date(updates.scheduled_end) : null;
  if (meeting.scheduled_start <= new Date()) throw new ValidationError("Meeting start must be in the future");
  if (meeting.scheduled_end && meeting.scheduled_end <= meeting.scheduled_start) throw new ValidationError("Meeting end must be after start");
  await meeting.save(); await audit("UPDATED", meeting, user, previous, meeting.status); return meeting;
}
export async function transition(meetingId, user, action) {
  const { meeting } = await context(meetingId, user._id);
  if (id(meeting.host_user_id) !== id(user._id)) throw new ForbiddenError("Only the meeting host can perform this action");
  const previous = meeting.status; const now = new Date();
  const transitions = { start: { scheduled: "waiting", waiting: "active" }, end: { waiting: "ended", active: "ended" }, cancel: { scheduled: "cancelled", waiting: "cancelled" } };
  const next = transitions[action]?.[meeting.status];
  if (!next) throw new ValidationError(`Cannot ${action} a meeting in status ${meeting.status}`);
  meeting.status = next; if (next === "active") meeting.started_at = now; if (next === "ended") meeting.ended_at = now;
  await meeting.save(); await audit(action === "cancel" ? "CANCELLED" : action === "start" ? "STARTED" : "ENDED", meeting, user, previous, next);
  emitToMeeting(meeting.room_id, action === "start" ? "meeting:started" : action === "end" ? "meeting:ended" : "meeting:cancelled", { meetingId: meeting._id, status: next });
  const other = meeting.participants.find((p) => id(p.user_id) !== id(user._id));
  if (other) await createNotification({ userId: other.user_id, type: action === "cancel" ? "meeting_cancelled" : action === "end" ? "meeting_ended" : "meeting_started", title: action === "cancel" ? "Meeting cancelled" : action === "end" ? "Meeting ended" : "Meeting started", body: meeting.title, data: { meeting_id: meeting._id, action: "view_meeting" } });
  return meeting;
}
export async function joinMeeting(meetingId, user) {
  const { meeting } = await context(meetingId, user._id);
  if (["cancelled", "ended"].includes(meeting.status)) throw new ValidationError("Meeting is no longer available", "MEETING_ALREADY_ENDED");
  const entry = meeting.participants.find((p) => id(p.user_id) === id(user._id));
  if (!entry) throw new ForbiddenError("You are not an allowed meeting participant");
  entry.joined_at = entry.joined_at || new Date(); entry.left_at = null;
  if (meeting.status === "scheduled") meeting.status = "waiting";
  await meeting.save(); await audit("JOINED", meeting, user, null, meeting.status);
  return { meeting, room_id: meeting.room_id, role: entry.role, ice_servers: iceServers() };
}
export async function leaveMeeting(meetingId, user) { const { meeting } = await context(meetingId, user._id); const entry = meeting.participants.find((p) => id(p.user_id) === id(user._id)); if (!entry) throw new ForbiddenError("Not an allowed participant"); entry.left_at = new Date(); await meeting.save(); await audit("LEFT", meeting, user); return meeting; }
export function canAccessMeeting(meeting, userId) { return meeting?.participants?.some((p) => id(p.user_id) === id(userId)) && !["cancelled", "ended"].includes(meeting.status); }
export function iceServers() { const list = []; if (process.env.WEBRTC_STUN_URL) list.push({ urls: process.env.WEBRTC_STUN_URL }); if (process.env.WEBRTC_TURN_URL && process.env.WEBRTC_TURN_USERNAME && process.env.WEBRTC_TURN_CREDENTIAL) list.push({ urls: process.env.WEBRTC_TURN_URL, username: process.env.WEBRTC_TURN_USERNAME, credential: process.env.WEBRTC_TURN_CREDENTIAL }); return list; }

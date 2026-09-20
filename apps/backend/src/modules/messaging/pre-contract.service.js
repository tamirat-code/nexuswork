import Project from "../projects/projects.model.js";
import User from "../users/users.model.js";
import StudentProfile from "../students/students.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { PreContractConversation, PreContractMessage } from "./pre-contract.model.js";
import { createNotification } from "../notifications/notifications.service.js";

async function assertProjectClient(projectId, user) {
  const project = await Project.findById(projectId).lean();
  if (!project) throw new NotFoundError("Project not found");
  if (String(project.client_id) !== String(user._id) && user.role !== "admin" && !(await isOrgMember(project.client_id, user._id))) {
    throw new ForbiddenError("Only the project client can contact recommended students");
  }
  return project;
}

async function assertParticipant(conversationId, userId) {
  const conversation = await PreContractConversation.findById(conversationId);
  if (!conversation) throw new NotFoundError("Interview conversation not found");
  if (![String(conversation.client_id), String(conversation.student_id)].includes(String(userId))) {
    throw new ForbiddenError("You are not a participant in this interview conversation");
  }
  return conversation;
}

export async function startPreContractConversation(projectId, studentId, user) {
  const project = await assertProjectClient(projectId, user);
  const student = await StudentProfile.findOne({ user_id: studentId }).select("user_id").lean();
  const activeStudent = await User.findOne({ _id: studentId, role: "student", status: "active" }).select("_id").lean();
  if (!student || !activeStudent) throw new ValidationError("This student is not available for a pre-contract conversation");

  return PreContractConversation.findOneAndUpdate(
    { project_id: project._id, client_id: user._id, student_id: student.user_id },
    { $setOnInsert: { project_id: project._id, client_id: user._id, student_id: student.user_id, status: "open" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate([
    { path: "project_id", select: "title status" },
    { path: "client_id", select: "name avatarUrl" },
    { path: "student_id", select: "name avatarUrl" },
  ]);
}

export async function getPreContractConversation(conversationId, userId, { limit = 100, skip = 0 } = {}) {
  const conversation = await assertParticipant(conversationId, userId);
  const [messages, total] = await Promise.all([
    PreContractMessage.find({ conversation_id: conversation._id }).sort({ createdAt: 1 }).skip(Number(skip)).limit(Number(limit)).populate({ path: "sender_id", select: "name avatarUrl" }).lean(),
    PreContractMessage.countDocuments({ conversation_id: conversation._id }),
  ]);
  return { conversation: await conversation.populate([{ path: "project_id", select: "title status" }, { path: "client_id", select: "name avatarUrl" }, { path: "student_id", select: "name avatarUrl" }]), messages, total, limit: Number(limit), skip: Number(skip) };
}

export async function sendPreContractMessage(conversationId, senderId, body) {
  const conversation = await assertParticipant(conversationId, senderId);
  if (conversation.status !== "open") throw new ValidationError("This interview conversation is closed");
  const cleanBody = String(body || "").trim();
  if (!cleanBody) throw new ValidationError("Message text is required");
  const message = await PreContractMessage.create({ conversation_id: conversation._id, sender_id: senderId, body: cleanBody });
  conversation.last_message_at = new Date();
  await conversation.save();
  const populated = await PreContractMessage.findById(message._id).populate({ path: "sender_id", select: "name avatarUrl" }).lean();
  const recipientId = String(conversation.client_id) === String(senderId) ? conversation.student_id : conversation.client_id;
  await createNotification({
    userId: recipientId,
    type: "pre_contract_message",
    title: `New interview message from ${populated.sender_id?.name || "a project participant"}`,
    body: cleanBody,
    data: { pre_contract_id: conversation._id, project_id: conversation.project_id, action: "view_pre_contract" },
  });
  return populated;
}

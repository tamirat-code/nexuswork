import Message from "./messaging.model.js";
import Contract from "../contracts/contracts.model.js";
import { emitToContract } from "../../websocket/socket.registry.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import crypto from "node:crypto";

async function assertParty(contractId, userId) {
  const contract = await Contract.findById(contractId);
  if (!contract) {
    const err = new Error("Contract not found");
    err.status = 404;
    throw err;
  }
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(userId));
  if (!isParty) {
    const err = new Error("Not a party to this contract");
    err.status = 403;
    throw err;
  }
  return contract;
}

import File from "../files/files.model.js";

export async function sendMessage(contractId, senderId, { body, attachments }, auditContext = {}) {
  const contract = await assertParty(contractId, senderId);

  const attachmentsInput = attachments || [];
  const attachmentIds = [];

  for (const att of attachmentsInput) {
    let file = null;
    // attachment may be a string ID or an object with url
    if (typeof att === "string" || (att && att._id)) {
      const id = typeof att === "string" ? att : att._id;
      file = await File.findById(id);
    } else if (att && att.url) {
      file = await File.findOne({ url: att.url });
    }

    if (!file) {
      const err = new Error("Attachment not found");
      err.status = 400;
      throw err;
    }

    if (String(file.owner_id) !== String(senderId)) {
      const err = new Error("Attachment does not belong to sender");
      err.status = 403;
      throw err;
    }

    attachmentIds.push(file._id);
  }

  const created = await Message.create({ contract_id: contractId, sender_id: senderId, body, attachments: attachmentIds });

  if (attachmentIds.length) {
    await File.updateMany(
      { _id: { $in: attachmentIds }, owner_id: senderId },
      { $set: { related_type: "message_attachment", related_id: created._id } }
    );
  }

  const message = await Message.findById(created._id)
    .populate({ path: "sender_id", select: "name avatarUrl" })
    .populate({ path: "attachments" })
    .lean();

  await recordEvent({
    actor: auditContext.actor,
    eventType: "MESSAGE_CREATED",
    action: "message.created",
    entityType: "message",
    entityId: created._id,
    previousState: null,
    newState: null,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { contractId, attachmentCount: attachmentIds.length },
  });

  emitToContract(contractId, "message:new", message);

  const recipientId = String(contract.client_id) === String(senderId) ? contract.student_id : contract.client_id;
  await createNotification({
    userId: recipientId,
    type: "new_message",
    title: `New message from ${message.sender_id?.name || "your contract partner"}`,
    body: body || (attachmentIds.length ? "You received a message with an attachment." : "You received a new message."),
    data: { contract_id: contractId, message_id: created._id, action: "view_contract" },
  });
  return message;
}

export async function listMessages(contractId, userId, { limit = 100, skip = 0 } = {}) {
  await assertParty(contractId, userId);
  const [messages, total] = await Promise.all([
    Message.find({ contract_id: contractId })
      .sort({ createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate({ path: "sender_id", select: "name avatarUrl" })
      .populate({ path: "attachments" })
      .lean(),
    Message.countDocuments({ contract_id: contractId }),
  ]);
  return { messages, total, limit: Number(limit), skip: Number(skip) };
}

import Message from "./messaging.model.js";
import Contract from "../contracts/contracts.model.js";
import File from "../files/files.model.js";
import { emitToContract } from "../../websocket/socket.registry.js";

async function assertParty(contractId, userId) {
  const contract = await Contract.findById(contractId).select("client_id student_id");
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

export async function sendMessage(contractId, senderId, { body, attachments = [] }) {
  await assertParty(contractId, senderId);

  const attachmentIds = [];
  for (const id of attachments) {
    const file = await File.findById(id);
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

    if (file.related_type !== "message_attachment") {
      const err = new Error("Only message attachments can be attached to messages");
      err.status = 400;
      throw err;
    }

    attachmentIds.push(file._id);
  }

  const created = await Message.create({
    contract_id: contractId,
    sender_id: senderId,
    body: body.trim(),
    attachments: attachmentIds,
  });

  const message = await Message.findById(created._id)
    .populate("sender_id", "name email")
    .populate("attachments")
    .lean();

  emitToContract(contractId, "message:new", message);
  return message;
}

export async function listMessages(contractId, userId, { limit = 100, skip = 0 } = {}) {
  await assertParty(contractId, userId);

  const [messages, total] = await Promise.all([
    Message.find({ contract_id: contractId })
      .populate("sender_id", "name email")
      .populate("attachments")
      .sort({ createdAt: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean(),
    Message.countDocuments({ contract_id: contractId }),
  ]);

  return { messages, total, limit: Number(limit), skip: Number(skip) };
}
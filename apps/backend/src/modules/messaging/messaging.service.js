import Message from "./messaging.model.js";
import Contract from "../contracts/contracts.model.js";
import { emitToContract } from "../../websocket/socket.registry.js";

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
}

import File from "../files/files.model.js";

export async function sendMessage(contractId, senderId, { body, attachments }) {
  await assertParty(contractId, senderId);

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

  const message = await Message.findById(created._id).populate({ path: "attachments" }).lean();

  emitToContract(contractId, "message:new", message);
  return message;
}

export async function listMessages(contractId, userId, { limit = 100, skip = 0 } = {}) {
  await assertParty(contractId, userId);
  const [messages, total] = await Promise.all([
    Message.find({ contract_id: contractId }).sort({ createdAt: 1 }).skip(Number(skip)).limit(Number(limit)).lean(),
    Message.countDocuments({ contract_id: contractId }),
  ]);
  return { messages, total, limit: Number(limit), skip: Number(skip) };
}

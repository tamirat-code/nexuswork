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

export async function sendMessage(contractId, senderId, { body, attachments }) {
  await assertParty(contractId, senderId);
  const message = await Message.create({ contract_id: contractId, sender_id: senderId, body, attachments });
  
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

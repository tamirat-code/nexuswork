import Contract from "./contracts.model.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function getContract(id) {
  return Contract.findById(id);
}

export async function listForUser(userId) {
  return Contract.find({ $or: [{ client_id: userId }, { student_id: userId }] }).sort({ createdAt: -1 });
}


export async function signContract(id, requestingUserId) {
  const contract = await Contract.findById(id);
  if (!contract) throw new NotFoundError("Contract not found");

  if (contract.status !== "pending_signature") {
    throw new ValidationError(`Cannot sign a contract in status ${contract.status}`);
  }

  const userId = String(requestingUserId);
  const isClient = String(contract.client_id) === userId;
  const isStudent = String(contract.student_id) === userId;
  if (!isClient && !isStudent) {
    throw new ForbiddenError("Not a party to this contract");
  }

  const now = new Date();
  if (isClient && !contract.client_signed_at) contract.client_signed_at = now;
  if (isStudent && !contract.student_signed_at) contract.student_signed_at = now;

  if (contract.client_signed_at && contract.student_signed_at) {
    contract.status = "active";
    contract.signed_at = contract.signed_at || now;
  }

  await contract.save();
  return contract;
}
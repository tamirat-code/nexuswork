import Contract from "./contracts.model.js";

export async function getContract(id) {
  return Contract.findById(id);
}

export async function listForUser(userId) {
  return Contract.find({ $or: [{ client_id: userId }, { student_id: userId }] }).sort({ createdAt: -1 });
}

export async function signContract(id, requestingUserId) {
  const contract = await Contract.findById(id);
  if (!contract) {
    const err = new Error("Contract not found");
    err.status = 404;
    throw err;
  }
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(requestingUserId));
  if (!isParty) {
    const err = new Error("Not a party to this contract");
    err.status = 403;
    throw err;
  }
  contract.status = "active";
  contract.signed_at = new Date();
  await contract.save();
  return contract;
}

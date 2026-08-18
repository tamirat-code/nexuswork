import crypto from "node:crypto";
import Contract from "./contracts.model.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { createNotification } from "../notifications/notifications.service.js";

function buildFingerprint(terms, version = 1) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ version, terms }))
    .digest("hex");
}

function isParty(contract, userId) {
  const id = String(userId);
  return {
    client: String(contract.client_id) === id,
    student: String(contract.student_id) === id,
  };
}

function ensureFingerprint(contract) {
  const current = buildFingerprint(contract.terms.toObject ? contract.terms.toObject() : contract.terms, contract.version);
  if (contract.terms_fingerprint !== current) {
    throw new ValidationError("Contract terms have changed. The contract must be regenerated before signing.");
  }
}

export async function getContract(id) {
  return Contract.findById(id)
    .populate("project_id", "title description category budget deadline")
    .populate("client_id", "name email")
    .populate("student_id", "name email")
    .lean();
}

export async function listForUser(userId) {
  return Contract.find({ $or: [{ client_id: userId }, { student_id: userId }] })
    .populate("project_id", "title category")
    .populate("client_id", "name")
    .populate("student_id", "name")
    .sort({ createdAt: -1 });
}

export async function reviewContract(id, requestingUserId) {
  const contract = await Contract.findById(id);
  if (!contract) throw new NotFoundError("Contract not found");

  if (!["pending_review", "pending_signature"].includes(contract.status)) {
    throw new ValidationError(`Cannot review a contract in status ${contract.status}`);
  }

  const party = isParty(contract, requestingUserId);
  if (!party.client && !party.student) throw new ForbiddenError("Not a party to this contract");

  ensureFingerprint(contract);
  const review = {
    reviewed_at: new Date(),
    contract_version: contract.version,
    terms_fingerprint: contract.terms_fingerprint,
  };

  if (party.client) contract.client_review = review;
  if (party.student) contract.student_review = review;

  if (contract.client_review?.reviewed_at && contract.student_review?.reviewed_at) {
    contract.status = "pending_signature";
  }

  await contract.save();

  const otherUserId = party.client ? contract.student_id : contract.client_id;
  await createNotification({
    userId: otherUserId,
    type: "contract_reviewed",
    title: "Contract reviewed",
    body: "The other party has reviewed the contract. Review it and sign when you are ready.",
    data: { contract_id: contract._id, action: "view_contract" },
  });

  return contract;
}

export async function signContract(id, requestingUserId, requestMeta = {}) {
  const contract = await Contract.findById(id);
  if (!contract) throw new NotFoundError("Contract not found");

  if (contract.status !== "pending_signature") {
    throw new ValidationError(`Cannot sign a contract in status ${contract.status}`);
  }

  const party = isParty(contract, requestingUserId);
  if (!party.client && !party.student) throw new ForbiddenError("Not a party to this contract");

  ensureFingerprint(contract);

  const reviewed = party.client ? contract.client_review?.reviewed_at : contract.student_review?.reviewed_at;
  if (!reviewed || String(party.client ? contract.client_review.terms_fingerprint : contract.student_review.terms_fingerprint) !== String(contract.terms_fingerprint)) {
    throw new ValidationError("You must review the current contract version before signing it.");
  }

  const now = new Date();
  const signature = {
    signed_at: now,
    contract_version: contract.version,
    terms_fingerprint: contract.terms_fingerprint,
    ip: requestMeta.ip || undefined,
    user_agent: requestMeta.userAgent || undefined,
  };

  if (party.client && !contract.client_signature?.signed_at) {
    contract.client_signature = signature;
    contract.client_signed_at = now;
  }
  if (party.student && !contract.student_signature?.signed_at) {
    contract.student_signature = signature;
    contract.student_signed_at = now;
  }

  if (contract.client_signature?.signed_at && contract.student_signature?.signed_at) {
    contract.status = "active";
    contract.signed_at = contract.signed_at || now;
  }

  await contract.save();

  const otherUserId = party.client ? contract.student_id : contract.client_id;
  await createNotification({
    userId: otherUserId,
    type: "contract_signed",
    title: "Contract signed",
    body: contract.status === "active"
      ? "Both parties have signed. The contract is now active."
      : "The other party has signed the contract. Your signature is still required.",
    data: { contract_id: contract._id, action: "view_contract" },
  });

  return contract;
}

export function buildContractTerms({ project, proposal }) {
  const terms = {
    title: project.title,
    description: project.description,
    total_amount: Number(proposal.price),
    currency: "USD",
    delivery_time_days: Number(proposal.delivery_time_days),
    deadline: project.deadline,
    revision_policy: "Reasonable revisions based on the agreed project scope.",
    cancellation_terms: "Cancellation is subject to the platform dispute and contract termination policy.",
    payment_terms: "Each milestone must be funded before work begins. Funds are released after client approval.",
  };
  return { terms, terms_fingerprint: buildFingerprint(terms, 1) };
}
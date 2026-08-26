import crypto from "node:crypto";
import Contract from "./contracts.model.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/exceptions/AppError.js";
import { createNotification } from "../notifications/notifications.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";

function buildFingerprint(terms, version = 1) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({ version, terms }))
    .digest("hex");
}

function getId(value) {
  return String(value?._id || value);
}

function isParty(contract, userId) {
  const id = String(userId);

  return {
    client: getId(contract.client_id) === id,
    student: getId(contract.student_id) === id,
  };
}

function ensureFingerprint(contract) {
  const terms =
    contract.terms?.toObject
      ? contract.terms.toObject()
      : contract.terms;

  const current = buildFingerprint(
    terms,
    contract.version
  );

  if (contract.terms_fingerprint !== current) {
    throw new ValidationError(
      "Contract terms have changed. The contract must be regenerated before signing."
    );
  }
}

function hasValidSignature(signature) {
  return Boolean(
    signature &&
    signature.signed_at
  );
}

function normalizeSignature(signature) {
  return hasValidSignature(signature)
    ? signature
    : null;
}

function normalizeContract(contract) {
  if (!contract) return contract;

  const normalized = contract.toObject
    ? contract.toObject()
    : { ...contract };

  normalized.client_signature =
    normalizeSignature(
      normalized.client_signature
    );

  normalized.student_signature =
    normalizeSignature(
      normalized.student_signature
    );

 
  normalized.client_signed_at =
    normalized.client_signed_at || null;

  normalized.student_signed_at =
    normalized.student_signed_at || null;

  normalized.signed_at =
    normalized.signed_at || null;

  return normalized;
}

export async function getContract(id) {
  const contract = await Contract.findById(id)
    .populate(
      "project_id",
      "title description category budget deadline"
    )
    .populate(
      "client_id",
      "name email"
    )
    .populate(
      "student_id",
      "name email"
    );

  return normalizeContract(contract);
}

export async function listForUser(userId) {
  const contracts = await Contract.find({
    $or: [
      { client_id: userId },
      { student_id: userId },
    ],
  })
    .populate(
      "project_id",
      "title category"
    )
    .populate(
      "client_id",
      "name"
    )
    .populate(
      "student_id",
      "name"
    )
    .sort({
      createdAt: -1,
    });

  return contracts.map(normalizeContract);
}

export async function reviewContract(
  id,
  requestingUserId,
  auditContext = {}
) {
  const contract =
    await Contract.findById(id);

  if (!contract) {
    throw new NotFoundError(
      "Contract not found"
    );
  }

  if (
    ![
      "pending_review",
      "pending_signature",
    ].includes(contract.status)
  ) {
    throw new ValidationError(
      `Cannot review a contract in status ${contract.status}`
    );
  }

  const party = isParty(
    contract,
    requestingUserId
  );

  if (
    !party.client &&
    !party.student
  ) {
    throw new ForbiddenError(
      "Not a party to this contract"
    );
  }

  ensureFingerprint(contract);

  const review = {
    reviewed_at: new Date(),
    contract_version:
      contract.version,
    terms_fingerprint:
      contract.terms_fingerprint,
  };

  if (party.client) {
    contract.client_review = review;
  }

  if (party.student) {
    contract.student_review = review;
  }

  const clientReviewed =
    Boolean(
      contract.client_review?.reviewed_at
    );

  const studentReviewed =
    Boolean(
      contract.student_review?.reviewed_at
    );

  if (
    clientReviewed &&
    studentReviewed
  ) {
    contract.status =
      "pending_signature";
  }

  const previousState = contract.status;
  await contract.save();

  await recordEvent({
    actor: auditContext.actor,
    eventType: "CONTRACT_REVIEWED",
    action: "contract.reviewed",
    entityType: "contract",
    entityId: contract._id,
    previousState: previousState === contract.status ? null : previousState,
    newState: previousState === contract.status ? null : contract.status,
    correlationId: auditContext.correlationId,
    metadata: { reviewedBy: party.client ? "client" : "student" },
  });

  const otherUserId = party.client
    ? contract.student_id
    : contract.client_id;

  await createNotification({
    userId: otherUserId,
    type: "contract_reviewed",
    title: "Contract reviewed",
    body:
      "The other party has reviewed the contract. Review it and sign when you are ready.",
    data: {
      contract_id: contract._id,
      action: "view_contract",
    },
  });

  return normalizeContract(contract);
}

export async function signContract(
  id,
  requestingUserId,
  requestMeta = {}
) {
  const contract =
    await Contract.findById(id);

  if (!contract) {
    throw new NotFoundError(
      "Contract not found"
    );
  }

  if (
    contract.status !==
    "pending_signature"
  ) {
    throw new ValidationError(
      `Cannot sign a contract in status ${contract.status}`
    );
  }

  const party = isParty(
    contract,
    requestingUserId
  );

  if (
    !party.client &&
    !party.student
  ) {
    throw new ForbiddenError(
      "Not a party to this contract"
    );
  }

  ensureFingerprint(contract);

  
  const currentReview =
    party.client
      ? contract.client_review
      : contract.student_review;

  if (
    !currentReview?.reviewed_at
  ) {
    throw new ValidationError(
      "You must review the contract before signing it."
    );
  }

  if (
    currentReview.contract_version !==
      contract.version ||
    currentReview.terms_fingerprint !==
      contract.terms_fingerprint
  ) {
    throw new ValidationError(
      "You must review the current contract version before signing it."
    );
  }

  
  if (
    party.client &&
    hasValidSignature(
      contract.client_signature
    )
  ) {
    throw new ValidationError(
      "You have already signed this contract."
    );
  }

  if (
    party.student &&
    hasValidSignature(
      contract.student_signature
    )
  ) {
    throw new ValidationError(
      "You have already signed this contract."
    );
  }

  const previousState = contract.status;
  const now = new Date();

  const signature = {
    signed_at: now,
    contract_version:
      contract.version,
    terms_fingerprint:
      contract.terms_fingerprint,
    ip:
      requestMeta.ip || undefined,
    user_agent:
      requestMeta.userAgent || undefined,
  };

 
  if (party.client) {
    contract.client_signature =
      signature;

    contract.client_signed_at =
      now;
  } else if (party.student) {
    contract.student_signature =
      signature;

    contract.student_signed_at =
      now;
  }


  const clientSigned =
    party.client
      ? true
      : hasValidSignature(
          contract.client_signature
        );

  const studentSigned =
    party.student
      ? true
      : hasValidSignature(
          contract.student_signature
        );

  if (
    clientSigned &&
    studentSigned
  ) {
    contract.status = "active";

    contract.signed_at =
      contract.signed_at ||
      now;
  }

  await contract.save();

  await recordEvent({
    actor: requestMeta.actor,
    eventType: "CONTRACT_SIGNED",
    action: "contract.signed",
    entityType: "contract",
    entityId: contract._id,
    previousState: previousState === contract.status ? null : previousState,
    newState: previousState === contract.status ? null : contract.status,
    correlationId: requestMeta.correlationId,
    metadata: { signedBy: party.client ? "client" : "student" },
  });

  if (previousState !== contract.status && contract.status === "active") {
    await recordEvent({
      actor: requestMeta.actor,
      eventType: "CONTRACT_ACTIVATED",
      action: "contract.activated",
      entityType: "contract",
      entityId: contract._id,
      previousState,
      newState: contract.status,
      correlationId: requestMeta.correlationId,
      metadata: { activatedBy: requestingUserId },
    });
  }

  const otherUserId = party.client
    ? contract.student_id
    : contract.client_id;

  await createNotification({
    userId: otherUserId,
    type: "contract_signed",
    title: "Contract signed",
    body:
      contract.status === "active"
        ? "Both parties have signed. The contract is now active."
        : "The other party has signed the contract. Your signature is still required.",
    data: {
      contract_id: contract._id,
      action: "view_contract",
    },
  });

  return normalizeContract(contract);
}

export function buildContractTerms({
  project,
  proposal,
}) {
  const terms = {
    title: project.title,
    description: project.description,
    total_amount: Number(
      proposal.price
    ),
    currency: String(project.currency || "USD").toUpperCase(),
    delivery_time_days: Number(
      proposal.delivery_time_days
    ),
    deadline: project.deadline,
    revision_policy:
      "Reasonable revisions based on the agreed project scope.",
    cancellation_terms:
      "Cancellation is subject to the platform dispute and contract termination policy.",
    payment_terms:
      "Each milestone must be funded before work begins. Funds are released after client approval.",
  };

  return {
    terms,
    terms_fingerprint:
      buildFingerprint(
        terms,
        1
      ),
  };
}

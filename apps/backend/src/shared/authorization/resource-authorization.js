import Contract from "../../modules/contracts/contracts.model.js";
import Milestone from "../../modules/milestones/milestones.model.js";
import Submission from "../../modules/submissions/submissions.model.js";
import Dispute from "../../modules/disputes/disputes.model.js";
import Invoice from "../../modules/invoices/invoices.model.js";
import File from "../../modules/files/files.model.js";
import Message from "../../modules/messaging/messaging.model.js";
import Project from "../../modules/projects/projects.model.js";
import { isOrgMember } from "../../modules/clients/clients.service.js";
import { ForbiddenError, NotFoundError } from "../exceptions/AppError.js";
import { ROLES } from "../enums/roles.enum.js";

function authenticatedUser(user, req) {
  const authenticated = req?.user || user;
  if (!authenticated?._id || !authenticated.role) throw new ForbiddenError("Authentication required");
  return authenticated;
}

function idOf(value) {
  return value?._id || value;
}

function sameId(left, right) {
  return String(idOf(left)) === String(idOf(right));
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) throw new ForbiddenError("Insufficient permissions");
}

function assertParty(contract, user) {
  if (!sameId(contract.client_id, user._id) && !sameId(contract.student_id, user._id)) {
    throw new ForbiddenError("You are not a party to this contract");
  }
}

async function loadContract(contractId) {
  const contract = await Contract.findById(contractId).select("client_id student_id project_id status");
  if (!contract) throw new NotFoundError("Contract not found");
  return contract;
}

export async function assertContractParty({ contractId, user, req, roles, allowAdmin = false, allowOrganizationMember = false } = {}) {
  const authenticated = authenticatedUser(user, req);
  if (roles) requireRole(authenticated, roles);
  const contract = await loadContract(contractId);
  if (allowAdmin && authenticated.role === ROLES.ADMIN) return contract;
  if (allowOrganizationMember && authenticated.role === ROLES.CLIENT && await isOrgMember(contract.client_id, authenticated._id)) return contract;
  assertParty(contract, authenticated);
  return contract;
}

export async function assertClientOnContract({ contractId, user, req, allowOrganizationMember = true } = {}) {
  const authenticated = authenticatedUser(user, req);
  requireRole(authenticated, [ROLES.CLIENT]);
  const contract = await loadContract(contractId);
  const isOwner = sameId(contract.client_id, authenticated._id);
  const isMember = !isOwner && allowOrganizationMember && await isOrgMember(contract.client_id, authenticated._id);
  if (!isOwner && !isMember) throw new ForbiddenError("You do not have client access to this contract");
  return contract;
}

export async function assertStudentOnContract({ contractId, user, req } = {}) {
  const authenticated = authenticatedUser(user, req);
  requireRole(authenticated, [ROLES.STUDENT]);
  const contract = await loadContract(contractId);
  if (!sameId(contract.student_id, authenticated._id)) {
    throw new ForbiddenError("You are not the student assigned to this contract");
  }
  return contract;
}

export async function assertOrganizationMember({ ownerUserId, user, req } = {}) {
  const authenticated = authenticatedUser(user, req);
  requireRole(authenticated, [ROLES.CLIENT]);
  if (!(await isOrgMember(ownerUserId, authenticated._id))) {
    throw new ForbiddenError("You are not an organization member for this resource");
  }
  return authenticated;
}

export async function assertMilestoneAccess({ milestoneId, user, req, role } = {}) {
  const authenticated = authenticatedUser(user, req);
  const milestone = await Milestone.findById(milestoneId).select("contract_id status");
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = await loadContract(milestone.contract_id);
  if (role === ROLES.CLIENT) {
    requireRole(authenticated, [ROLES.CLIENT]);
    if (!sameId(contract.client_id, authenticated._id) && !(await isOrgMember(contract.client_id, authenticated._id))) {
      throw new ForbiddenError("You do not have client access to this milestone");
    }
  } else if (role === ROLES.STUDENT) {
    requireRole(authenticated, [ROLES.STUDENT]);
    if (!sameId(contract.student_id, authenticated._id)) {
      throw new ForbiddenError("You are not assigned to this milestone");
    }
  } else {
    assertParty(contract, authenticated);
  }
  return { milestone, contract };
}

export async function assertSubmissionAccess({ submissionId, user, req, role } = {}) {
  const authenticated = authenticatedUser(user, req);
  const submission = await Submission.findById(submissionId).select("milestone_id reviewer_id");
  if (!submission) throw new NotFoundError("Submission not found");
  const context = await assertMilestoneAccess({ milestoneId: submission.milestone_id, user: authenticated, role });
  return { submission, ...context };
}

export async function assertDisputeAccess({ disputeId, user, req, role, allowAdmin = false } = {}) {
  const authenticated = authenticatedUser(user, req);
  const dispute = await Dispute.findById(disputeId).select("milestone_id opened_by status");
  if (!dispute) throw new NotFoundError("Dispute not found");
  if (allowAdmin && authenticated.role === ROLES.ADMIN) {
    const milestone = await Milestone.findById(dispute.milestone_id).select("contract_id status");
    if (!milestone) throw new NotFoundError("Milestone not found");
    return { dispute, milestone, contract: await loadContract(milestone.contract_id) };
  }
  const context = await assertMilestoneAccess({ milestoneId: dispute.milestone_id, user: authenticated, role });
  return { dispute, ...context };
}

export async function assertInvoiceAccess({ invoiceId, user, req, role } = {}) {
  const authenticated = authenticatedUser(user, req);
  const invoice = await Invoice.findById(invoiceId).select("contract_id client_id student_id");
  if (!invoice) throw new NotFoundError("Invoice not found");
  const contract = await loadContract(invoice.contract_id);
  if (!sameId(invoice.client_id, contract.client_id) || !sameId(invoice.student_id, contract.student_id)) {
    throw new ForbiddenError("Invoice relationship is invalid");
  }
  if (role === ROLES.CLIENT) {
    await assertClientOnContract({ contractId: contract._id, user: authenticated });
  } else if (role === ROLES.STUDENT) {
    await assertStudentOnContract({ contractId: contract._id, user: authenticated });
  } else {
    requireRole(authenticated, [ROLES.CLIENT, ROLES.STUDENT]);
    assertParty(contract, authenticated);
  }
  return { invoice, contract };
}

export async function assertFileAccess({ fileId, user, req } = {}) {
  const authenticated = authenticatedUser(user, req);
  const file = await File.findById(fileId).select("owner_id related_type related_id");
  if (!file) throw new NotFoundError("File not found");
  if (file.related_type === "contract") {
    if (authenticated.role === ROLES.ADMIN) throw new ForbiddenError("You do not have access to this file");
    await assertContractParty({ contractId: file.related_id, user: authenticated });
  } else if (file.related_type === "submission") {
    await assertSubmissionAccess({ submissionId: file.related_id, user: authenticated });
  } else if (file.related_type === "message_attachment") {
    await assertMessageAccess({ messageId: file.related_id, user: authenticated, allowAdmin: true });
  } else if (file.related_type === "project_attachment") {
    const project = await Project.findById(file.related_id).select("client_id");
    if (!project) throw new NotFoundError("Project not found");
    if (authenticated.role === ROLES.ADMIN || sameId(project.client_id, authenticated._id)) return file;
    if (authenticated.role === ROLES.CLIENT && await isOrgMember(project.client_id, authenticated._id)) return file;
    throw new ForbiddenError("You do not have access to this project attachment");
  } else if (file.related_type === "cv") {
    if (sameId(file.owner_id, authenticated._id) || authenticated.role === ROLES.ADMIN) return file;
    const Proposal = (await import("../../modules/proposals/proposals.model.js")).default;
    const proposals = await Proposal.find({ cv_file_id: file._id }).populate("project_id", "client_id");
    for (const p of proposals) {
      if (p.project_id) {
        const clientId = p.project_id.client_id;
        if (sameId(clientId, authenticated._id)) return file;
        if (authenticated.role === ROLES.CLIENT && await isOrgMember(clientId, authenticated._id)) return file;
      }
    }
    throw new ForbiddenError("You do not have access to this CV");
  } else if (["verification_document", "staff_verification_document", "skill_certification_evidence", "portfolio"].includes(file.related_type)) {
    // The module service retains the detailed owner/staff/publication checks.
    return file;
  } else if (authenticated.role === ROLES.ADMIN) {
    return file;
  } else if (sameId(file.owner_id, authenticated._id)) {
    return file;
  } else {
    throw new ForbiddenError("You do not have access to this file");
  }
  return file;
}

export async function assertFileUploadAccess({ relatedType, relatedId, user, req } = {}) {
  const authenticated = authenticatedUser(user, req);
  if (relatedType === "cv") {
    if (authenticated.role !== ROLES.STUDENT) throw new ForbiddenError("Only students can upload a CV");
    return authenticated;
  }
  if (!["contract", "submission", "project_attachment"].includes(relatedType)) return authenticated;
  if (!relatedId) throw new NotFoundError(`${relatedType} resource not found`);
  if (relatedType === "contract") {
    await assertContractParty({ contractId: relatedId, user: authenticated });
  } else if (relatedType === "submission") {
    await assertSubmissionAccess({ submissionId: relatedId, user: authenticated });
  } else {
    const project = await Project.findById(relatedId).select("client_id");
    if (!project) throw new NotFoundError("Project not found");
    if (authenticated.role !== ROLES.ADMIN && !(authenticated.role === ROLES.CLIENT && (sameId(project.client_id, authenticated._id) || await isOrgMember(project.client_id, authenticated._id)))) {
      throw new ForbiddenError("You do not have access to this project");
    }
  }
  return authenticated;
}

export async function assertMessageAccess({ messageId, user, req, allowAdmin = false } = {}) {
  const authenticated = authenticatedUser(user, req);
  const message = await Message.findById(messageId).select("contract_id sender_id");
  if (!message) throw new NotFoundError("Message not found");
  if (allowAdmin && authenticated.role === ROLES.ADMIN) return { message, contract: await loadContract(message.contract_id) };
  const contract = await assertContractParty({ contractId: message.contract_id, user: authenticated });
  return { message, contract };
}

export async function assertContractResourceAccess({ resourceType, resourceId, user, req, role } = {}) {
  switch (resourceType) {
    case "contract":
      return assertContractParty({ contractId: resourceId, user, req, roles: role ? [role] : undefined });
    case "milestone":
      return assertMilestoneAccess({ milestoneId: resourceId, user, req, role });
    case "submission":
      return assertSubmissionAccess({ submissionId: resourceId, user, req, role });
    case "dispute":
      return assertDisputeAccess({ disputeId: resourceId, user, req, role });
    case "invoice":
      return assertInvoiceAccess({ invoiceId: resourceId, user, req, role });
    case "file":
      return assertFileAccess({ fileId: resourceId, user, req });
    case "message":
      return assertMessageAccess({ messageId: resourceId, user, req });
    default:
      throw new NotFoundError("Unsupported contract resource");
  }
}

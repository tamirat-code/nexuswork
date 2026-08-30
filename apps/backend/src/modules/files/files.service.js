import fs from "fs";
import path from "path";
import crypto from "crypto";
import File from "./files.model.js";
import Contract from "../contracts/contracts.model.js";
import Project from "../projects/projects.model.js";
import PortfolioItem from "../portfolios/portfolios.model.js";
import Message from "../messaging/messaging.model.js";
import University from "../universities/universities.model.js";
import { storageConfig } from "../../config/storage.config.js";
import { putPrivateObject, getPrivateObject, deletePrivateObject } from "../../shared/utils/private-storage.client.js";
import { NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { isOrgMember } from "../clients/clients.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";

export async function createFileRecord({ ownerId, multerFile, related_type, related_id, contentHash, auditContext = {} }) {
  const filename = storageConfig.driver === "s3"
    ? `${crypto.randomUUID()}${path.extname(multerFile.originalname).toLowerCase()}`
    : multerFile.filename;

  if (storageConfig.driver === "s3") {
    await putPrivateObject({
      key: filename,
      body: multerFile.buffer,
      contentType: multerFile.mimetype,
    });
  }

  const file = new File({
    owner_id: ownerId,
    filename,
    original_name: path.basename(multerFile.originalname).replace(/[\u0000-\u001f\u007f]/g, "_").slice(0, 255),
    mimetype: multerFile.mimetype,
    size: multerFile.size,
    content_sha256: contentHash,
    // Private content is served only through the authenticated file endpoint.
    url: "",
    related_type: related_type || "other",
    related_id: related_id || undefined,
  });

  file.url = `/v1/files/content/${file._id}`;
  await file.save();
  await recordEvent({
    actor: auditContext.actor,
    eventType: "FILE_CREATED",
    action: "file.created",
    entityType: "file",
    entityId: file._id,
    previousState: null,
    newState: null,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { relatedType: file.related_type, relatedId: file.related_id, ownerId },
  });
  return file;
}

async function assertContractParty(contractId, userId) {
  const contract = await Contract.findById(contractId).select("client_id student_id");
  if (!contract) throw new NotFoundError("Contract not found");

  const allowed = [String(contract.client_id), String(contract.student_id)].includes(String(userId));
  if (!allowed) throw new ForbiddenError("You are not a party to this contract");

  return contract;
}

export async function listForContract(contractId, requestingUserId) {
  await assertContractParty(contractId, requestingUserId);

  return File.find({
    related_type: "contract",
    related_id: contractId,
  })
    .sort({ createdAt: -1 })
    .populate("owner_id", "name email")
    .lean();
}

export async function assertSubmissionParty(submissionId, requestingUserId) {
  const Submission = (await import("../submissions/submissions.model.js")).default;
  const submission = await Submission.findById(submissionId).select("milestone_id");
  if (!submission) throw new NotFoundError("Submission not found");

  const milestone = await (await import("../milestones/milestones.model.js")).default
    .findById(submission.milestone_id)
    .select("contract_id");
  if (!milestone) throw new NotFoundError("Milestone not found");

  await assertContractParty(milestone.contract_id, requestingUserId);
  return submission;
}


async function assertProjectAttachmentAccess(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this file");
  if (String(file.owner_id) === String(requestingUser._id) || requestingUser.role === "admin") return;
  const project = await Project.findById(file.related_id).select("client_id status");
  if (!project) throw new NotFoundError("Project not found");
  if (String(project.client_id) === String(requestingUser._id)) return;
  if (requestingUser.role === "client" && await isOrgMember(project.client_id, requestingUser._id)) return;
  throw new ForbiddenError("You don't have access to this file");
}

async function assertPortfolioFileAccess(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this file");
  if (String(file.owner_id) === String(requestingUser._id) || requestingUser.role === "admin") return;
  const portfolio = await PortfolioItem.findById(file.related_id).select("user_id is_published consent_status");
  if (!portfolio) throw new NotFoundError("Portfolio item not found");
  if (portfolio.is_published && portfolio.consent_status !== "denied") return;
  throw new ForbiddenError("You don't have access to this file");
}

async function assertMessageAttachmentAccess(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this file");
  if (String(file.owner_id) === String(requestingUser._id) || requestingUser.role === "admin") return;
  const message = await Message.findById(file.related_id).select("contract_id");
  if (!message) throw new NotFoundError("Message not found");
  await assertContractParty(message.contract_id, requestingUser._id);
}

export async function getById(id, requestingUser) {
  const file = await File.findById(id);
  if (!file) throw new NotFoundError("File not found");

  if (file.related_type === "verification_document") {
    await assertCanViewVerificationDocument(file, requestingUser);
  }

  if (file.related_type === "staff_verification_document") {
    await assertCanViewStaffVerificationDocument(file, requestingUser);
  }

  if (file.related_type === "skill_certification_evidence") {
    await assertCanViewSkillCertificationEvidence(file, requestingUser);
  }

  if (file.related_type === "contract") {
    await assertContractParty(file.related_id, requestingUser?._id);
  }

  if (file.related_type === "submission") {
    await assertSubmissionParty(file.related_id, requestingUser?._id);
  }

  if (file.related_type === "project_attachment") {
    await assertProjectAttachmentAccess(file, requestingUser);
  }

  if (file.related_type === "portfolio") {
    await assertPortfolioFileAccess(file, requestingUser);
  }

  if (file.related_type === "message_attachment") {
    await assertMessageAttachmentAccess(file, requestingUser);
  }

  if (file.related_type === "other") {
    if (!requestingUser || (String(file.owner_id) !== String(requestingUser._id) && requestingUser.role !== "admin")) {
      throw new ForbiddenError("You don't have access to this file");
    }
  }

  return file;
}

async function assertCanViewVerificationDocument(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this document");
  if (String(file.owner_id) === String(requestingUser._id)) return;
  if (requestingUser.role === "admin") return;

  if (requestingUser.role === "university_staff") {
    const [{ default: Verification }, { default: University }] = await Promise.all([
      import("../verifications/verifications.model.js"),
      import("../universities/universities.model.js"),
    ]);
    const verification = await Verification.findOne({ document_file_id: file._id });
    if (verification) {
      const university = await University.findById(verification.university_id);
      const isContactStaff = university?.contact_staff?.some(
        (staffId) => String(staffId) === String(requestingUser._id)
      );
      if (isContactStaff) return;
    }
  }

  throw new ForbiddenError("You don't have access to this document");
}

async function assertCanViewStaffVerificationDocument(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this document");
  if (String(file.owner_id) === String(requestingUser._id)) return;
  if (requestingUser.role === "admin") return;

  throw new ForbiddenError("You don't have access to this document");
}

async function assertCanViewSkillCertificationEvidence(file, requestingUser) {
  if (!requestingUser) throw new ForbiddenError("You don't have access to this evidence");
  if (String(file.owner_id) === String(requestingUser._id) || requestingUser.role === "admin") return;
  const SkillCertificationRequest = (await import("../verifications/skill-certification-request.model.js")).default;
  const request = await SkillCertificationRequest.findOne({ evidence_file_id: file._id }).select("university_id");
  if (!request) throw new NotFoundError("Skill certification request not found");
  const university = await University.findById(request.university_id).select("contact_staff");
  if (university?.contact_staff?.some((staffId) => String(staffId) === String(requestingUser._id))) return;
  throw new ForbiddenError("You don't have access to this evidence");
}

export async function getPrivateContent(file) {
  if (storageConfig.driver === "s3") {
    return getPrivateObject(file.filename);
  }
  const diskPath = path.join(storageConfig.absoluteUploadDir, file.filename);
  if (path.dirname(path.resolve(diskPath)) !== path.resolve(storageConfig.absoluteUploadDir)) {
    throw new ForbiddenError("Invalid file storage path");
  }
  if (!fs.existsSync(diskPath)) throw new NotFoundError("File content not found");
  return { Body: fs.createReadStream(diskPath) };
}

export async function deleteFile(id, requestingUserId, auditContext = {}) {
  const file = await File.findById(id);
  if (!file) throw new NotFoundError("File not found");

  if (file.related_type === "contract") {
    await assertContractParty(file.related_id, requestingUserId);
  }

  if (file.related_type === "submission") {
    await assertSubmissionParty(file.related_id, requestingUserId);
  }

  if (String(file.owner_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the uploader can delete this file");
  }

  if (storageConfig.driver === "s3") {
    await deletePrivateObject(file.filename);
  } else {
    const diskPath = path.join(storageConfig.absoluteUploadDir, file.filename);
    fs.unlink(diskPath, () => {});
  }

  await file.deleteOne();
  await recordEvent({
    actor: auditContext.actor,
    eventType: "FILE_DELETED",
    action: "file.deleted",
    entityType: "file",
    entityId: file._id,
    previousState: "stored",
    newState: "deleted",
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { relatedType: file.related_type, relatedId: file.related_id, ownerId: file.owner_id },
  });
  return { deleted: true };
}

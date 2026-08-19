import Submission from "./submissions.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import File from "../files/files.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { eventBus } from "../../events/index.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

async function getMilestoneContext(milestoneId) {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = await Contract.findById(milestone.contract_id);
  if (!contract) throw new NotFoundError("Contract not found");

  return { milestone, contract };
}

async function assertContractParty(contract, userId) {
  const isParty = [String(contract.client_id), String(contract.student_id)].includes(String(userId));
  if (isParty) return;

  const allowed = await isOrgMember(contract.client_id, userId);
  if (!allowed) throw new ForbiddenError("You are not a party to this contract");
}

export async function addSubmission(milestoneId, studentId, { file_ids = [], file_url, note } = {}) {
  const { milestone, contract } = await getMilestoneContext(milestoneId);

  if (String(contract.student_id) !== String(studentId)) {
    throw new ForbiddenError("Only the assigned student can submit work");
  }

  if (!["funded", "in_progress", "revision_requested"].includes(milestone.status)) {
    throw new ValidationError(`Milestone must be funded or awaiting revision before work can be submitted (current: ${milestone.status})`);
  }

  const normalizedFileIds = [...new Set((file_ids || []).map(String).filter(Boolean))];
  const normalizedNote = String(note || "").trim();

  if (!normalizedNote && normalizedFileIds.length === 0 && !file_url) {
    throw new ValidationError("Add a delivery note or at least one deliverable file");
  }

  if (normalizedFileIds.length > 10) {
    throw new ValidationError("A submission can contain at most 10 files");
  }

  const latest = await Submission.findOne({ milestone_id: milestoneId }).sort({ version: -1 });
  if (latest?.review_status === "pending_review") {
    throw new ValidationError("This milestone already has a submission waiting for client review");
  }

  const nextVersion = Number(latest?.version || 0) + 1;

  let files = [];
  if (normalizedFileIds.length) {
    files = await File.find({
      _id: { $in: normalizedFileIds },
      owner_id: studentId,
    });

    if (files.length !== normalizedFileIds.length) {
      throw new ForbiddenError("One or more selected files are not owned by the submitting student");
    }
  }

  const previousSubmissionId = latest?._id;
  const submission = await Submission.create({
    milestone_id: milestoneId,
    version: nextVersion,
    file_ids: normalizedFileIds,
    file_url,
    file_urls: files.map((file) => file.url).concat(file_url ? [file_url] : []),
    note: normalizedNote,
    review_status: "pending_review",
    submitted_at: new Date(),
    supersedes_submission_id: previousSubmissionId,
  });

  if (files.length) {
    await File.updateMany(
      { _id: { $in: normalizedFileIds } },
      { $set: { related_type: "submission", related_id: submission._id } }
    );
  }

  milestone.status = "submitted";
  milestone.delivered_at = new Date();
  await milestone.save();

  await logAction({
    action_type: "milestone_work_submitted",
    entity_type: "submission",
    entity_id: submission._id,
    actor_id: studentId,
    details: {
      milestone_id: milestoneId,
      version: nextVersion,
      file_count: normalizedFileIds.length,
    },
  });

  eventBus.emit("milestone.delivered", {
    milestoneId: milestone._id,
    clientId: contract.client_id,
    submissionId: submission._id,
    version: nextVersion,
  });

  return Submission.findById(submission._id).populate("file_ids").lean();
}

export async function listForMilestone(milestoneId, requestingUserId) {
  const { contract } = await getMilestoneContext(milestoneId);
  await assertContractParty(contract, requestingUserId);

  return Submission.find({ milestone_id: milestoneId })
    .sort({ version: 1 })
    .populate("file_ids")
    .populate("reviewer_id", "name email")
    .lean();
}

export async function getLatestForMilestone(milestoneId) {
  return Submission.findOne({ milestone_id: milestoneId }).sort({ version: -1 });
}

export async function requestRevision(submissionId, requestingUserId, reason = "") {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new NotFoundError("Submission not found");

  const { milestone, contract } = await getMilestoneContext(submission.milestone_id);

  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can request a revision");
  }

  const feedback = String(reason || "").trim();
  if (feedback.length < 10) {
    throw new ValidationError("Revision feedback must be at least 10 characters");
  }

  if (!["submitted", "delivered"].includes(milestone.status)) {
    throw new ValidationError("Only submitted work can be sent back for revision");
  }

  if (submission.review_status !== "pending_review") {
    throw new ValidationError("Only a submission awaiting review can receive a revision request");
  }

  if (Number(milestone.revision_count || 0) >= Number(milestone.max_revisions || 0)) {
    throw new ValidationError("The maximum number of revisions has been reached");
  }

  milestone.revision_count = Number(milestone.revision_count || 0) + 1;
  milestone.status = "revision_requested";
  await milestone.save();

  submission.review_status = "revision_requested";
  submission.revision_reason = feedback;
  submission.feedback = feedback;
  submission.reviewer_id = requestingUserId;
  submission.reviewed_at = new Date();
  await submission.save();

  await logAction({
    action_type: "milestone_revision_requested",
    entity_type: "submission",
    entity_id: submission._id,
    actor_id: requestingUserId,
    details: {
      milestone_id: milestone._id,
      version: submission.version,
      revision_count: milestone.revision_count,
      max_revisions: milestone.max_revisions,
      reason: feedback,
    },
  });

  eventBus.emit("milestone.revision_requested", {
    milestoneId: milestone._id,
    studentId: contract.student_id,
    submissionId: submission._id,
    version: submission.version,
    reason: feedback,
    revisionCount: milestone.revision_count,
    maxRevisions: milestone.max_revisions,
  });

  return Submission.findById(submission._id).populate("file_ids").lean();
}

export async function approveSubmission(milestoneId, requestingUserId) {
  const { milestone, contract } = await getMilestoneContext(milestoneId);
  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can approve this submission");
  }

  if (!["submitted", "delivered"].includes(milestone.status)) {
    throw new ValidationError("Milestone must have submitted work before approval");
  }

  const latest = await Submission.findOne({ milestone_id: milestoneId }).sort({ version: -1 });
  if (!latest) throw new ValidationError("No submission exists for this milestone");
  if (latest.review_status !== "pending_review") {
    throw new ValidationError("The latest submission is not awaiting review");
  }

  latest.review_status = "approved";
  latest.reviewer_id = requestingUserId;
  latest.reviewed_at = new Date();
  await latest.save();

  return latest;
}
import Submission from "./submissions.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function addSubmission(milestoneId, { file_url, note }) {
  const count = await Submission.countDocuments({ milestone_id: milestoneId });
  return Submission.create({
    milestone_id: milestoneId,
    version: count + 1,
    file_url,
    note,
    review_status: "pending",
  });
}

export async function listForMilestone(milestoneId) {
  return Submission.find({ milestone_id: milestoneId }).sort({ version: 1 }).lean();
}

export async function requestRevision(submissionId, requestingUserId, reason = "") {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new NotFoundError("Submission not found");

  const milestone = await Milestone.findById(submission.milestone_id);
  if (!milestone) throw new NotFoundError("Milestone not found");

  const contract = await Contract.findById(milestone.contract_id);
  if (!contract) throw new NotFoundError("Contract not found");

  if (String(contract.client_id) !== String(requestingUserId)) {
    const allowed = await isOrgMember(contract.client_id, requestingUserId);
    if (!allowed) throw new ForbiddenError("Only the client can request a revision");
  }

  if (milestone.status !== "delivered") {
    throw new ValidationError("Only delivered work can be sent back for revision");
  }

  submission.review_status = "revision_requested";
  submission.revision_reason = reason.trim();
  submission.reviewed_at = new Date();
  await submission.save();

  milestone.status = "funded";
  await milestone.save();

  return submission;
}
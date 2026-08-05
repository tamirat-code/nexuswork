import Submission from "./submissions.model.js";

export async function addSubmission(milestoneId, { file_url, note }) {
  const count = await Submission.countDocuments({ milestone_id: milestoneId });
  return Submission.create({ milestone_id: milestoneId, version: count + 1, file_url, note });
}

export async function listForMilestone(milestoneId) {
  return Submission.find({ milestone_id: milestoneId }).sort({ version: 1 });
}

export async function requestRevision(submissionId) {
  return Submission.findByIdAndUpdate(submissionId, { review_status: "revision_requested" }, { new: true });
}

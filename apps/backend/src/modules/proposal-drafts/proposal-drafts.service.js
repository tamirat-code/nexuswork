import ProposalDraft from "./proposal-drafts.model.js";
import Project from "../projects/projects.model.js";
import { NotFoundError } from "../../shared/exceptions/AppError.js";

export async function getDraft(studentId, projectId) {
  return ProposalDraft.findOne({ student_id: studentId, project_id: projectId }).lean();
}

export async function upsertDraft(studentId, projectId, data) {
  const project = await Project.findById(projectId).select("_id").lean();
  if (!project) throw new NotFoundError("Project not found");
  return ProposalDraft.findOneAndUpdate(
    { student_id: studentId, project_id: projectId },
    { $set: { ...data, student_id: studentId, project_id: projectId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function deleteDraft(studentId, projectId) {
  await ProposalDraft.deleteOne({ student_id: studentId, project_id: projectId });
  return { deleted: true };
}

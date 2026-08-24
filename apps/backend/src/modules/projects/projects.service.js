import Project from "./projects.model.js";
import ClientProfile from "../clients/clients.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import File from "../files/files.model.js";

export async function createProject(actingUserId, data) {
  const { on_behalf_of_client_id, ...projectData } = data;

  let ownerId = actingUserId;
  if (on_behalf_of_client_id && String(on_behalf_of_client_id) !== String(actingUserId)) {
    const allowed = await isOrgMember(on_behalf_of_client_id, actingUserId);
    if (!allowed) {
      throw new ForbiddenError("Not authorized to post projects on behalf of this client account");
    }
    ownerId = on_behalf_of_client_id;
  }

  const attachmentIds = [...new Set((projectData.attachments || []).map(String))];
  if (attachmentIds.length) {
    const files = await File.find({ _id: { $in: attachmentIds }, owner_id: actingUserId });
    if (files.length !== attachmentIds.length) {
      throw new ForbiddenError("One or more project attachments do not belong to you");
    }
    projectData.attachments = attachmentIds;
  } else {
    delete projectData.attachments;
  }

  const project = await Project.create({ client_id: ownerId, created_by: actingUserId, ...projectData });
  if (attachmentIds.length) {
    await File.updateMany(
      { _id: { $in: attachmentIds } },
      { $set: { related_type: "project_attachment", related_id: project._id } }
    );
  }
  return project;
}

const SORT_STAGES = {
  newest: { createdAt: -1 },
  budget: { budget: -1 },
  proposals: { proposals_count: 1 },
};

export async function searchProjects(query) {
  const { skill, minBudget, maxBudget, q, search, status, category, experience_level, sort } = query;

  const match = { status: status || "open" };
  if (skill) match.required_skills = skill;
  if (category && category !== "All") match.category = category;
  if (experience_level && experience_level !== "any") match.experience_level = experience_level;
  if (minBudget || maxBudget) {
    match.budget = {};
    if (minBudget) match.budget.$gte = Number(minBudget);
    if (maxBudget) match.budget.$lte = Number(maxBudget);
  }

  const searchTerm = search || q;
  if (searchTerm) match.$text = { $search: searchTerm };

  const sortStage = SORT_STAGES[sort] || SORT_STAGES.newest;

  return Project.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "proposals",
        localField: "_id",
        foreignField: "project_id",
        as: "_proposals",
      },
    },
    { $addFields: { proposals_count: { $size: "$_proposals" } } },
    {
      $lookup: {
        from: "users",
        localField: "client_id",
        foreignField: "_id",
        as: "_client",
      },
    },
    { $unwind: { path: "$_client", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "clientprofiles",
        localField: "client_id",
        foreignField: "user_id",
        as: "_clientProfile",
      },
    },
    { $unwind: { path: "$_clientProfile", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        client_id: {
          _id: "$_client._id",
          name: "$_client.name",
          client_profile: {
            organization_name: "$_clientProfile.organization_name",
          },
        },
      },
    },
    { $project: { _proposals: 0, _client: 0, _clientProfile: 0 } },
    { $sort: sortStage },
    { $limit: 100 },
  ]);
}

export async function getProjectById(id) {
  const project = await Project.findById(id).populate("client_id", "name").lean();
  if (!project) return null;

  const clientProfile = project.client_id
    ? await ClientProfile.findOne({ user_id: project.client_id._id }).lean()
    : null;

  return {
    ...project,
    client_id: project.client_id
      ? {
          ...project.client_id,
          client_profile: clientProfile ? { organization_name: clientProfile.organization_name } : null,
        }
      : null,
  };
}
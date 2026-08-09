import Project from "./projects.model.js";
import ClientProfile from "../clients/clients.model.js";

export async function createProject(clientId, data) {
  return Project.create({ client_id: clientId, ...data });
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
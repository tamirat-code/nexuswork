import Project from "./projects.model.js";
import ClientProfile from "../clients/clients.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import File from "../files/files.model.js";
import Skill from "../skills/skills.model.js";
import { getCategoryMatchValues, normalizeCategory } from "../milestones/deliverable-templates.js";

export async function createProject(actingUserId, data) {
  const { on_behalf_of_client_id, required_skill_ids = [], required_skills = [], ...projectData } = data;

  if (projectData.category) projectData.category = normalizeCategory(projectData.category);

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

  const requestedSkillIds = [...new Set(required_skill_ids.map(String))];
  const requestedSkillNames = [...new Set(required_skills.map((skill) => String(skill).trim()).filter(Boolean))];
  let skills = [];
  if (requestedSkillIds.length) {
    skills = await Skill.find({ _id: { $in: requestedSkillIds }, is_active: true })
      .select("_id name slug")
      .lean();
    if (skills.length !== requestedSkillIds.length) {
      throw new ForbiddenError("One or more selected skills are unavailable");
    }
  } else if (requestedSkillNames.length) {
    const normalized = requestedSkillNames.map((skill) => skill.toLowerCase());
    skills = await Skill.find({
      is_active: true,
      $or: [{ name: { $in: requestedSkillNames } }, { slug: { $in: normalized } }],
    }).select("_id name slug").lean();
    if (skills.length !== requestedSkillNames.length) {
      throw new ForbiddenError("Required skills must be selected from the shared skill catalogue");
    }
  }
  projectData.required_skill_ids = skills.map((skill) => skill._id);
  projectData.required_skills = skills.map((skill) => skill.name);
  if (projectData.budget_type === "range") projectData.budget = projectData.budget_max;

  const project = await Project.create({ client_id: ownerId, created_by: actingUserId, ...projectData });
  if (attachmentIds.length) {
    await File.updateMany(
      { _id: { $in: attachmentIds } },
      { $set: { related_type: "project_attachment", related_id: project._id } }
    );
  }
  return project;
}

export async function updateProject(projectId, actingUserId, data) {
  const project = await Project.findById(projectId);
  if (!project) throw new NotFoundError("Project not found");
  if (String(project.client_id) !== String(actingUserId) && !(await isOrgMember(project.client_id, actingUserId))) {
    throw new ForbiddenError("Not authorized to edit this project");
  }
  if (project.status !== "open") {
    throw new ValidationError("Only open projects can be edited");
  }

  const { required_skill_ids, required_skills, attachments, ...updates } = data;
  if (updates.category) updates.category = normalizeCategory(updates.category);
  const requestedSkillIds = [...new Set((required_skill_ids || []).map(String))];
  const requestedSkillNames = [...new Set((required_skills || []).map((skill) => String(skill).trim()).filter(Boolean))];
  let skills = [];
  if (requestedSkillIds.length) {
    skills = await Skill.find({ _id: { $in: requestedSkillIds }, is_active: true }).select("_id name").lean();
    if (skills.length !== requestedSkillIds.length) throw new ForbiddenError("One or more selected skills are unavailable");
  } else if (requestedSkillNames.length) {
    skills = await Skill.find({ is_active: true, $or: [
      { name: { $in: requestedSkillNames } },
      { slug: { $in: requestedSkillNames.map((skill) => skill.toLowerCase()) } },
    ] }).select("_id name").lean();
    if (skills.length !== requestedSkillNames.length) throw new ForbiddenError("Required skills must be selected from the shared skill catalogue");
  }

  if (required_skill_ids !== undefined || required_skills !== undefined) {
    updates.required_skill_ids = skills.map((skill) => skill._id);
    updates.required_skills = skills.map((skill) => skill.name);
  }
  if (attachments !== undefined) {
    const attachmentIds = [...new Set(attachments.map(String))];
    const files = await File.find({ _id: { $in: attachmentIds }, owner_id: actingUserId });
    if (files.length !== attachmentIds.length) throw new ForbiddenError("One or more project attachments do not belong to you");
    updates.attachments = attachmentIds;
  }

  const effectiveBudgetType = updates.budget_type ?? project.budget_type ?? "fixed";
  if (effectiveBudgetType === "range") {
    const effectiveBudgetMin = updates.budget_min ?? project.budget_min;
    const effectiveBudgetMax = updates.budget_max ?? project.budget_max;
    if (!(effectiveBudgetMin > 0) || !(effectiveBudgetMax >= effectiveBudgetMin)) {
      throw new ValidationError("A range budget requires a valid minimum and maximum");
    }
    updates.budget_min = effectiveBudgetMin;
    updates.budget_max = effectiveBudgetMax;
    updates.budget = effectiveBudgetMax;
  } else if (updates.budget_min !== undefined || updates.budget_max !== undefined) {
    throw new ValidationError("Budget minimum and maximum require a range budget");
  } else if (effectiveBudgetType === "fixed") {
    updates.budget_min = undefined;
    updates.budget_max = undefined;
  }

  Object.assign(project, updates);
  await project.save();
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
  if (skill) {
    match.required_skill_ids = skill.match(/^[0-9a-fA-F]{24}$/)
      ? skill
      : { $in: [skill] };
    if (!skill.match(/^[0-9a-fA-F]{24}$/)) delete match.required_skill_ids;
    if (!skill.match(/^[0-9a-fA-F]{24}$/)) match.required_skills = skill;
  }
  if (category && category !== "All") match.category = { $in: getCategoryMatchValues(category) };
  if (experience_level && experience_level !== "any") match.experience_level = experience_level;
  if (minBudget || maxBudget) {
    const minimum = minBudget ? Number(minBudget) : 0;
    const maximum = maxBudget ? Number(maxBudget) : Number.MAX_SAFE_INTEGER;
    match.$or = [
      { budget_type: "fixed", budget: { $gte: minimum, $lte: maximum } },
      { budget_type: "range", budget_min: { $lte: maximum }, budget_max: { $gte: minimum } },
      // Legacy projects have only budget and are treated as fixed.
      { budget_type: { $exists: false }, budget: { $gte: minimum, $lte: maximum } },
    ];
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

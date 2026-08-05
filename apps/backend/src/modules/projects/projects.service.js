import Project from "./projects.model.js";

export async function createProject(clientId, data) {
  return Project.create({ client_id: clientId, ...data });
}

export async function searchProjects(query) {
  const { skill, minBudget, maxBudget, q, status } = query;
  const filter = { status: status || "open" };
  if (skill) filter.required_skills = skill;
  if (minBudget || maxBudget) {
    filter.budget = {};
    if (minBudget) filter.budget.$gte = Number(minBudget);
    if (maxBudget) filter.budget.$lte = Number(maxBudget);
  }
  if (q) filter.$text = { $search: q };
  return Project.find(filter).sort({ createdAt: -1 }).limit(100);
}

export async function getProjectById(id) {
  return Project.findById(id);
}

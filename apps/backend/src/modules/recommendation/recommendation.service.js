import Project from "../projects/projects.model.js";
import StudentProfile from "../students/students.model.js";
import Proposal from "../proposals/proposals.model.js";
import User from "../users/users.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import RecommendationCache from "./recommendation.model.js";
import { aiConfig } from "../../config/ai.config.js";
import { logger } from "../../shared/logger/logger.js";
import { ForbiddenError, NotFoundError } from "../../shared/exceptions/AppError.js";


function scoreBySkillOverlap(project, studentSkills) {
  const names = new Set(studentSkills.map((s) => s.name?.toLowerCase()));
  const overlap = (project.required_skills || []).filter((s) => names.has(s.toLowerCase()));
  return overlap.length / Math.max(1, (project.required_skills || []).length);
}


function scoreStudentBySkillOverlap(project, studentSkills) {
  return scoreBySkillOverlap(project, studentSkills || []);
}


async function rankWithAI(studentProfile, shortlist) {
  if (aiConfig.provider === "none" || !aiConfig.apiKey) return null;

  const prompt = `Student skills: ${JSON.stringify(studentProfile.skills)}.
Candidate projects (id, title, required_skills, budget): ${JSON.stringify(
    shortlist.map((p) => ({ id: p._id, title: p.title, required_skills: p.required_skills, budget: p.budget }))
  )}.
Return ONLY a JSON array of project ids, best match first.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": aiConfig.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: aiConfig.model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with status ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "[]";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function getRecommendationsForStudent(studentUserId) {
  const profile = await StudentProfile.findOne({ user_id: studentUserId });
  if (!profile) {
    const err = new Error("Student profile not found");
    err.status = 404;
    throw err;
  }

  const openProjects = await Project.find({ status: "open" }).limit(200);
  const shortlist = openProjects
    .map((p) => ({ project: p, score: scoreBySkillOverlap(p, profile.skills) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((s) => s.project);

  let orderedIds = shortlist.map((p) => String(p._id));

  try {
    const aiOrder = await rankWithAI(profile, shortlist);
    if (Array.isArray(aiOrder) && aiOrder.length) orderedIds = aiOrder;
  } catch (err) {
    logger.warn("[recommendation] AI ranking failed, falling back to skill-overlap order:", err.message);
  }

  const byId = new Map(shortlist.map((p) => [String(p._id), p]));
  const ranked = orderedIds.map((id) => byId.get(String(id))).filter(Boolean);

  await RecommendationCache.findOneAndUpdate(
    { student_id: studentUserId },
    { project_ids: ranked.map((p) => p._id), generated_at: new Date() },
    { upsert: true }
  );

  return ranked;
}


export async function getRecommendationsForClient(projectId, requestingUser) {
  const project = await Project.findById(projectId);
  if (!project) throw new NotFoundError("Project not found");

  if (String(project.client_id) !== String(requestingUser._id) && requestingUser.role !== "admin") {
    const allowed = await isOrgMember(project.client_id, requestingUser._id);
    if (!allowed) throw new ForbiddenError("Not authorized to view recommendations for this project");
  }

  const candidates = await StudentProfile.find({ verification_status: "verified" }).limit(500).lean();
  const shortlist = candidates
    .map((profile) => ({ profile, score: scoreStudentBySkillOverlap(project, profile.skills) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const userIds = shortlist.map((c) => c.profile.user_id);
  const users = await User.find({ _id: { $in: userIds } }, "name avatar_url").lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  return shortlist.map(({ profile, score }) => ({
    user: userById.get(String(profile.user_id)) || { _id: profile.user_id },
    skills: profile.skills,
    match_score: Math.round(score * 100) / 100,
  }));
}


export async function getPriceSuggestion({ requiredSkills = [], category } = {}) {
  const skillSet = new Set((requiredSkills || []).map((s) => s.toLowerCase()));

  const matchQuery = { status: "accepted" };
  const accepted = await Proposal.find(matchQuery).populate("project_id", "required_skills category").lean();

  const relevant = accepted.filter((p) => {
    const proj = p.project_id;
    if (!proj) return false;
    if (category && proj.category && proj.category !== category) return false;
    if (!skillSet.size) return true;
    return (proj.required_skills || []).some((s) => skillSet.has(String(s).toLowerCase()));
  });

  const pool = relevant.length ? relevant : accepted;
  if (!pool.length) {
    return { suggested_price: null, sample_size: 0, basis: "no_historical_data" };
  }

  const prices = pool.map((p) => p.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;

  return {
    suggested_price: Math.round(median * 100) / 100,
    sample_size: pool.length,
    basis: relevant.length ? "skill_and_category_match" : "platform_wide_fallback",
  };
}
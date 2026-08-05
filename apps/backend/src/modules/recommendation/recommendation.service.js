import Project from "../projects/projects.model.js";
import StudentProfile from "../students/students.model.js";
import RecommendationCache from "./recommendation.model.js";
import { aiConfig } from "../../config/ai.config.js";
import { logger } from "../../shared/logger/logger.js";

// --- Fallback: deterministic skill-overlap scoring, no external calls ---
// Always available, used when AI_PROVIDER=none, no API key is configured,
// or the AI call fails — the recommendation module should never hard-fail.
function scoreBySkillOverlap(project, studentSkills) {
  const names = new Set(studentSkills.map((s) => s.name?.toLowerCase()));
  const overlap = (project.required_skills || []).filter((s) => names.has(s.toLowerCase()));
  return overlap.length / Math.max(1, (project.required_skills || []).length);
}

// --- AI-assisted ranking via the Anthropic API ---
// Sends the student's skills and a shortlist of open projects (already
// pre-filtered by the fallback scorer) and asks the model to rank + explain.
// This keeps token usage bounded instead of sending every open project.
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

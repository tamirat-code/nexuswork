import { RecommendationEvent, RecommendationGovernanceSettings, RecommendationModelEvaluation } from "./recommendation-governance.model.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { aiConfig } from "../../config/ai.config.js";
import Project from "../projects/projects.model.js";
import { isOrgMember } from "../clients/clients.service.js";

const DEFAULT_THRESHOLDS = { deadline_warning_hours: 72, stale_check_in_days: 7, max_overdue_tasks: 0 };

export async function getGovernanceSettings() {
  const settings = await RecommendationGovernanceSettings.findOne({ key: "default" }).lean();
  return settings || {
    key: "default",
    enabled_model: { provider: aiConfig.provider || "skill-overlap", name: aiConfig.model || "skill-overlap", version: aiConfig.modelVersion || "v1" },
    risk_thresholds: DEFAULT_THRESHOLDS,
  };
}

export async function getRiskThresholds() {
  const settings = await getGovernanceSettings();
  return { ...DEFAULT_THRESHOLDS, ...(settings.risk_thresholds || {}) };
}

export async function updateGovernanceSettings(actor, payload) {
  if (actor.role !== "admin") throw new ForbiddenError("Only admins can change recommendation governance settings");
  const current = await getGovernanceSettings();
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(current.risk_thresholds || {}), ...(payload.risk_thresholds || {}) };
  for (const [key, value] of Object.entries(thresholds)) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) throw new ValidationError(`Invalid risk threshold: ${key}`);
  }
  return RecommendationGovernanceSettings.findOneAndUpdate(
    { key: "default" },
    {
      key: "default",
      risk_thresholds: thresholds,
      enabled_model: payload.enabled_model || current.enabled_model,
      updated_by: actor._id,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function recordRecommendationEvent(actor, payload) {
  if (!["client", "admin", "student"].includes(actor.role)) throw new ForbiddenError("This account cannot record recommendation outcomes");
  if (!["impression", "selection", "dismissal", "outcome"].includes(payload.event_type)) throw new ValidationError("Invalid recommendation event type");
  if (!payload.project_id || !payload.student_id || !payload.recommendation_id) throw new ValidationError("project_id, student_id, and recommendation_id are required");
  const project = await Project.findById(payload.project_id).select("client_id").lean();
  if (!project) throw new NotFoundError("Project not found");
  if (actor.role === "student" && String(payload.student_id) !== String(actor._id)) throw new ForbiddenError("Students can only record their own recommendation events");
  if (actor.role === "client" && String(project.client_id) !== String(actor._id) && !(await isOrgMember(project.client_id, actor._id))) throw new ForbiddenError("Not authorized to record this recommendation event");
  return RecommendationEvent.create({
    ...payload,
    actor_id: actor._id,
    model_provider: payload.model_provider || aiConfig.provider || "skill-overlap",
    model_name: payload.model_name || aiConfig.model || "skill-overlap",
    model_version: payload.model_version || aiConfig.modelVersion || "v1",
  });
}

export async function listRecommendationEvents({ projectId, limit = 100 } = {}) {
  const query = projectId ? { project_id: projectId } : {};
  return RecommendationEvent.find(query).sort({ createdAt: -1 }).limit(Math.min(500, Math.max(1, Number(limit) || 100))).lean();
}

export async function listModelEvaluations() {
  return RecommendationModelEvaluation.find({}).sort({ evaluated_at: -1 }).populate("reviewer_id", "name email").lean();
}

export async function createModelEvaluation(actor, payload) {
  if (actor.role !== "admin") throw new ForbiddenError("Only admins can create model evaluations");
  const required = ["provider", "name", "version", "evaluated_at", "review_due_at", "methodology"];
  if (required.some((key) => !payload[key])) throw new ValidationError("provider, name, version, dates, and methodology are required");
  return RecommendationModelEvaluation.create({ ...payload, reviewer_id: actor._id });
}

export async function assertEnabledModelEvaluated() {
  const settings = await getGovernanceSettings();
  const model = settings.enabled_model;
  const evaluation = await RecommendationModelEvaluation.findOne({ provider: model.provider, name: model.name, version: model.version, status: "approved", review_due_at: { $gte: new Date() } }).lean();
  return { model, evaluated: Boolean(evaluation), evaluation: evaluation || null };
}

export async function getRecommendationGovernanceSummary() {
  const [settings, modelStatus, events] = await Promise.all([
    getGovernanceSettings(),
    assertEnabledModelEvaluated(),
    RecommendationEvent.aggregate([{ $group: { _id: "$event_type", count: { $sum: 1 } } }]),
  ]);
  return { settings, enabled_model: modelStatus, event_counts: Object.fromEntries(events.map((item) => [item._id, item.count])) };
}

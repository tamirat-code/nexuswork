import Project from "../projects/projects.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Task from "./tasks.model.js";
import CheckIn from "./check-ins.model.js";
import AtRiskAssessment from "./at-risk-assessments.model.js";
import { isOrgMember } from "../clients/clients.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { env } from "../../config/env.js";
import { getRiskThresholds } from "../recommendation/recommendation-governance.service.js";
import OrgMembership from "../organizations/org-membership.model.js";

const TERMINAL_MILESTONE_STATUSES = new Set(["released"]);
const ACTIVE_MILESTONE_STATUSES = new Set(["funded", "in_progress", "submitted", "delivered", "revision_requested", "approved"]);

async function getContext(projectId, userId) {
  const project = await Project.findById(projectId).lean();
  if (!project) throw new NotFoundError("Project not found");
  const contract = await Contract.findOne({ project_id: projectId }).select("_id client_id student_id status").lean();
  if (!contract) throw new NotFoundError("Project oversight is available after a contract is created");

  const isClientOwner = String(contract.client_id) === String(userId);
  const isStudent = String(contract.student_id) === String(userId);
  const isOrgClient = !isClientOwner && await isOrgMember(contract.client_id, userId);
  if (!isClientOwner && !isStudent && !isOrgClient) throw new ForbiddenError("You do not have access to this project oversight workspace");
  return { project, contract, isClientOwner, isStudent, isOrgClient };
}

async function getMilestoneForProject(projectId, milestoneId) {
  const milestone = await Milestone.findOne({ _id: milestoneId, contract_id: (await Contract.findOne({ project_id: projectId }).select("_id").lean())?._id });
  if (!milestone) throw new ValidationError("Milestone does not belong to this project");
  return milestone;
}

export async function createTask(projectId, user, data) {
  const context = await getContext(projectId, user._id);
  if (context.isStudent) throw new ForbiddenError("Only the client team can create project tasks");
  const milestone = await getMilestoneForProject(projectId, data.milestone_id);
  const assigneeId = data.assignee_id || context.contract.student_id;
  if (String(assigneeId) !== String(context.contract.student_id)) throw new ValidationError("Tasks can only be assigned to the contracted student");
  const status = data.status || "todo";
  return Task.create({
    ...data,
    status,
    project_id: projectId,
    milestone_id: milestone._id,
    assignee_id: assigneeId,
    created_by: user._id,
    status_history: [{ status, changed_by: user._id }],
  });
}

export async function updateTask(taskId, user, data) {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError("Task not found");
  const context = await getContext(task.project_id, user._id);
  const isClient = context.isClientOwner || context.isOrgClient;
  if (!isClient && String(task.assignee_id) !== String(user._id)) throw new ForbiddenError("You cannot update this task");
  const updates = isClient ? data : { status: data.status };
  if (updates.status && updates.status !== task.status) task.status_history.push({ status: updates.status, changed_by: user._id });
  if (updates.status === "completed") updates.completed_at = task.completed_at || new Date();
  if (updates.status && updates.status !== "completed") updates.completed_at = null;
  Object.assign(task, updates);
  await task.save();
  return task;
}

export async function createCheckIn(projectId, user, data) {
  const context = await getContext(projectId, user._id);
  if (!context.isStudent || String(context.contract.student_id) !== String(user._id)) {
    throw new ForbiddenError("Only the contracted student can submit check-ins");
  }
  const milestone = await getMilestoneForProject(projectId, data.milestone_id);
  const checkIn = await CheckIn.create({ ...data, project_id: projectId, milestone_id: milestone._id, author_id: user._id });
  await createNotification({
    userId: context.contract.client_id,
    type: "project_check_in",
    title: "New project check-in",
    body: `A student posted a ${data.progress}% progress update for ${milestone.title}.`,
    data: { project_id: projectId, contract_id: context.contract._id, action: "view_oversight" },
  });
  return checkIn;
}

export async function listCheckIns(projectId, user) {
  await getContext(projectId, user._id);
  return CheckIn.find({ project_id: projectId }).populate("author_id", "name role").sort({ createdAt: -1 }).lean();
}

export function riskFactors({ milestone, tasks, latestCheckIn, now = new Date(), deadlineWarningHours = env.oversightDeadlineWarningHours, staleCheckInDays = env.oversightStaleCheckInDays, maxOverdueTasks = 0 }) {
  if (TERMINAL_MILESTONE_STATUSES.has(milestone.status)) return [];
  const factors = [];
  const dueDate = milestone.due_date ? new Date(milestone.due_date) : null;
  if (dueDate && dueDate < now) factors.push({ code: "overdue_milestone", severity: "high" });
  else if (dueDate && dueDate.getTime() - now.getTime() <= deadlineWarningHours * 60 * 60 * 1000) factors.push({ code: `deadline_within_${deadlineWarningHours}_hours`, severity: "medium" });
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const overdueTasks = tasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== "completed").length;
  if (blocked) factors.push({ code: "blocked_tasks", count: blocked, severity: "high" });
  if (overdueTasks > maxOverdueTasks) factors.push({ code: "overdue_tasks", count: overdueTasks, threshold: maxOverdueTasks, severity: "medium" });
  if (ACTIVE_MILESTONE_STATUSES.has(milestone.status) && (!latestCheckIn || now.getTime() - new Date(latestCheckIn.createdAt).getTime() > staleCheckInDays * 24 * 60 * 60 * 1000)) {
    factors.push({ code: "stale_check_in", severity: "medium" });
  }
  return factors;
}

export async function evaluateMilestoneRisk(milestoneId, { notify = true } = {}) {
  const milestone = await Milestone.findById(milestoneId).lean();
  if (!milestone) throw new NotFoundError("Milestone not found");
  const contract = await Contract.findById(milestone.contract_id).select("_id client_id student_id project_id").lean();
  if (!contract) throw new NotFoundError("Contract not found");
  const [tasks, latestCheckIn, previous] = await Promise.all([
    Task.find({ milestone_id: milestone._id }).lean(),
    CheckIn.findOne({ milestone_id: milestone._id }).sort({ createdAt: -1 }).lean(),
    AtRiskAssessment.findOne({ milestone_id: milestone._id }).lean(),
  ]);
  const thresholds = await getRiskThresholds();
  const factors = riskFactors({ milestone, tasks, latestCheckIn, ...thresholds });
  const status = factors.length ? "at_risk" : "not_at_risk";
  const assessment = await AtRiskAssessment.findOneAndUpdate(
    { milestone_id: milestone._id },
    { project_id: contract.project_id, milestone_id: milestone._id, status, factors, evaluator_version: "oversight-v1", evaluated_at: new Date(), recovered_at: previous?.status === "at_risk" && status === "not_at_risk" ? new Date() : previous?.recovered_at || null },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  if (notify && previous?.status !== status) {
    const title = status === "at_risk" ? "Milestone needs attention" : "Milestone risk recovered";
    const body = status === "at_risk" ? `Milestone ${milestone.title} has ${factors.length} risk factor(s).` : `Milestone ${milestone.title} is no longer marked at risk.`;
    await Promise.all([contract.client_id, contract.student_id].map((userId) => createNotification({ userId, type: "at_risk_update", title, body, data: { project_id: contract.project_id, milestone_id: milestone._id, action: "view_oversight" } })));
  }
  return assessment;
}

export async function getOversight(projectId, user) {
  const context = await getContext(projectId, user._id);
  const milestones = await Milestone.find({ contract_id: context.contract._id }).sort({ sequence: 1 }).lean();
  const [tasks, checkIns] = await Promise.all([
    Task.find({ project_id: projectId }).populate("assignee_id", "name").sort({ milestone_id: 1, sort_order: 1, createdAt: 1 }).lean(),
    CheckIn.find({ project_id: projectId }).populate("author_id", "name role").sort({ createdAt: -1 }).lean(),
  ]);
  const assessments = await Promise.all(milestones.map((milestone) => evaluateMilestoneRisk(milestone._id, { notify: false })));
  const assessmentByMilestone = new Map(assessments.map((item) => [String(item.milestone_id), item]));
  const released = milestones.filter((milestone) => milestone.status === "released");
  const completed = milestones.map((milestone) => milestone.released_at || milestone.approved_at || milestone.delivered_at).filter(Boolean);
  const onTime = milestones.filter((milestone) => {
    const completedAt = milestone.released_at || milestone.approved_at || milestone.delivered_at;
    return completedAt && milestone.due_date && new Date(completedAt) <= new Date(milestone.due_date);
  }).length;
  const delays = milestones.map((milestone) => {
    const completedAt = milestone.released_at || milestone.approved_at || milestone.delivered_at;
    return completedAt && milestone.due_date ? Math.max(0, new Date(completedAt).getTime() - new Date(milestone.due_date).getTime()) / 86400000 : null;
  }).filter((value) => value !== null);
  return {
    project: context.project,
    contract: context.contract,
    milestones: milestones.map((milestone) => ({ ...milestone, risk: assessmentByMilestone.get(String(milestone._id)) || null, tasks: tasks.filter((task) => String(task.milestone_id) === String(milestone._id)) })),
    tasks,
    check_ins: checkIns,
    analytics: { total_milestones: milestones.length, completed_milestones: released.length, completion_rate: milestones.length ? released.length / milestones.length : 0, on_time_milestones: onTime, late_milestones: Math.max(completed.length - onTime, 0), average_delay_days: delays.length ? delays.reduce((sum, value) => sum + value, 0) / delays.length : 0, at_risk_milestones: assessments.filter((item) => item.status === "at_risk").length },
  };
}

export async function evaluateAtRiskMilestones({ limit = 100 } = {}) {
  const soon = new Date(Date.now() + env.oversightEvaluationHorizonDays * 24 * 60 * 60 * 1000);
  const safeLimit = Math.min(1000, Math.max(1, Number(limit) || 100));
  const milestones = await Milestone.find({ status: { $in: [...ACTIVE_MILESTONE_STATUSES] }, due_date: { $lte: soon } }).select("_id").limit(safeLimit).lean();
  const results = await Promise.allSettled(milestones.map((milestone) => evaluateMilestoneRisk(milestone._id)));
  return {
    evaluated: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}

export async function getClientContractsOverview(user) {
  if (!["client", "admin"].includes(user.role)) throw new ForbiddenError("Only clients and admins can view contract oversight");
  let query = {};
  if (user.role !== "admin") {
    const memberships = await OrgMembership.find({ user_id: user._id, status: "active" }).select("organization_id").lean();
    query = { $or: [{ client_id: user._id }, ...(memberships.length ? [{ organization_id: { $in: memberships.map((item) => item.organization_id) } }] : [])] };
  }
  const contracts = await Contract.find(query)
    .populate("project_id", "title category deadline")
    .populate("student_id", "name avatarUrl")
    .populate("client_id", "name")
    .sort({ createdAt: -1 })
    .lean();
  const contractIds = contracts.map((contract) => contract._id);
  const milestones = await Milestone.find({ contract_id: { $in: contractIds } }).sort({ sequence: 1 }).lean();
  return contracts.map((contract) => {
    const items = milestones.filter((milestone) => String(milestone.contract_id) === String(contract._id));
    return {
      ...contract,
      milestones: items,
      oversight: {
        total_milestones: items.length,
        released_milestones: items.filter((item) => item.status === "released").length,
        funded_milestones: items.filter((item) => ["funded", "in_progress", "submitted", "delivered", "revision_requested", "approved", "release_pending"].includes(item.status)).length,
        at_risk_milestones: items.filter((item) => ["release_failed", "disputed"].includes(item.status)).length,
      },
    };
  });
}

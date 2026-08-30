import AnalyticsEvent from "./analytics.model.js";
import Project from "../projects/projects.model.js";
import User from "../users/users.model.js";
import Contract from "../contracts/contracts.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import StudentProfile from "../students/students.model.js";
import University from "../universities/universities.model.js";
import * as paymentsService from "../payments/payments.service.js";
import { ForbiddenError, NotFoundError } from "../../shared/exceptions/AppError.js";
import { env } from "../../config/env.js";

export function isUniversityCohortSuppressed(verifiedStudentCount, minimumCohortSize = env.analyticsMinCohortSize) {
  return Number(verifiedStudentCount) < Number(minimumCohortSize);
}

export async function trackEvent({ userId, eventType, entityType, entityId, metadata }) {
  return AnalyticsEvent.create({
    user_id: userId,
    event_type: eventType,
    entity_type: entityType || "",
    entity_id: entityId,
    metadata: metadata || {},
  });
}

export async function getPlatformMetrics({ days = 30 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const [
    totalUsers,
    totalStudents,
    totalClients,
    totalProjects,
    openProjects,
    activeContracts,
    totalPayments,
    totalRevenue,
    commissionAgg,
    popularSkillsAgg,
    demandByCategoryAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "client" }),
    Project.countDocuments(),
    Project.countDocuments({ status: "open" }),
    Contract.countDocuments({ status: "active" }),
    Payment.countDocuments({ status: "succeeded" }),
    Payment.aggregate([
      { $match: { status: "succeeded", direction: "release" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((rows) => rows[0]?.total || 0),
    Payment.aggregate([
      { $match: { status: "succeeded", direction: "commission" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((rows) => rows[0]?.total || 0),
    Project.aggregate([
      { $unwind: "$required_skills" },
      { $match: { required_skills: { $nin: [null, ""] } } },
      { $group: { _id: "$required_skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    Project.aggregate([
      { $match: { category: { $nin: [null, ""] } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
  ]);

  const recentEvents = await AnalyticsEvent.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$event_type", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  return {
    total_users: totalUsers,
    total_students: totalStudents,
    total_clients: totalClients,
    total_projects: totalProjects,
    open_projects: openProjects,
    active_contracts: activeContracts,
    total_payments: totalPayments,
    total_revenue: totalRevenue,
    top_events: recentEvents,
    period_days: Number(days),

    
    active_projects: activeContracts,
    students: totalStudents,
    income: commissionAgg,
    popular_skills: popularSkillsAgg.map((row) => ({ name: row._id, count: row.count })),
    demand_by_category: demandByCategoryAgg.map((row) => ({ category: row._id, projects: row.count })),
  };
}

export async function getUserMetrics(userId) {

  const myContracts = await Contract.find({ student_id: userId }).select("_id");
  const myContractIds = myContracts.map((c) => c._id);
  const myMilestones = await Milestone.find({ contract_id: { $in: myContractIds } }).select("_id");
  const myMilestoneIds = myMilestones.map((m) => m._id);

  const [projectsPosted, contractsAsClient, contractsAsStudent, paymentsReceived] = await Promise.all([
    Project.countDocuments({ client_id: userId }),
    Contract.countDocuments({ client_id: userId }),
    Contract.countDocuments({ student_id: userId }),
    Payment.aggregate([
      { $match: { status: "succeeded", direction: "release", milestone_id: { $in: myMilestoneIds } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).then((rows) => rows[0] || { total: 0, count: 0 }),
  ]);

  return {
    projects_posted: projectsPosted,
    contracts_as_client: contractsAsClient,
    contracts_as_student: contractsAsStudent,
    earnings: paymentsReceived.total,
    payments_count: paymentsReceived.count,
  };
}



export async function getMyAnalytics(userId) {
 
  const payments = await paymentsService.listForUser(userId);
  const earnings = payments
    .filter((p) => p.direction === "release")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    earnings,
    payments_count: payments.length,
  };
}


export async function getUniversityMetrics(universityId, requestingUser) {
  const university = await University.findById(universityId);
  if (!university) throw new NotFoundError("University not found");

  if (requestingUser.role !== "admin") {
    const isContactStaff = university.contact_staff?.some((id) => String(id) === String(requestingUser._id));
    if (!isContactStaff) {
      throw new ForbiddenError("Only staff at this university, or an admin, can view its analytics");
    }
  }

  const students = await StudentProfile.find({ university_id: universityId }).lean();
  const studentUserIds = students.map((s) => s.user_id);
  const verifiedStudents = students.filter((s) => s.verification_status === "verified");
  const verifiedUserIds = verifiedStudents.map((s) => s.user_id);
  const minimumCohortSize = env.analyticsMinCohortSize;
  const cohortSuppressed = isUniversityCohortSuppressed(verifiedStudents.length, minimumCohortSize);

  if (cohortSuppressed) {
    return {
      university: { id: university._id, name: university.name },
      privacy_suppressed: true,
      minimum_cohort_size: minimumCohortSize,
      message: `University outcomes are hidden until at least ${minimumCohortSize} verified students are available.`,
    };
  }

  
  const studentsWithContracts = verifiedUserIds.length
    ? await Contract.distinct("student_id", {
        student_id: { $in: verifiedUserIds },
        status: { $in: ["active", "completed"] },
      })
    : [];
  const employmentRate = verifiedUserIds.length ? studentsWithContracts.length / verifiedUserIds.length : null;

  
  const skillCounts = new Map();
  for (const student of verifiedStudents) {
    for (const skill of student.skills || []) {
      const key = skill.name?.trim();
      if (!key) continue;
      skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .filter(([, count]) => count >= minimumCohortSize)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  
  const contractIds = verifiedUserIds.length
    ? await Contract.find({ student_id: { $in: verifiedUserIds } }).distinct("_id")
    : [];
  const earningsAgg = contractIds.length
    ? await Milestone.aggregate([
        { $match: { contract_id: { $in: contractIds }, status: "released" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ])
    : [];
  const totalEarnings = earningsAgg[0]?.total || 0;
  const releasedMilestoneCount = earningsAgg[0]?.count || 0;

  const activeProjects = verifiedUserIds.length
    ? await Contract.countDocuments({ student_id: { $in: verifiedUserIds }, status: "active" })
    : 0;

  const deliveredMilestones = contractIds.length
    ? await Milestone.find({
        contract_id: { $in: contractIds },
        delivered_at: { $ne: null },
        status: { $in: ["delivered", "revision_requested", "approved", "released"] },
      })
        .select("delivered_at due_date")
        .lean()
    : [];
  const onTimeCount = deliveredMilestones.filter(
    (m) => m.delivered_at && m.due_date && new Date(m.delivered_at) <= new Date(m.due_date)
  ).length;
  const onTimeRate = deliveredMilestones.length
    ? Math.round((onTimeCount / deliveredMilestones.length) * 1000) / 10
    : null;

  return {
    university: { id: university._id, name: university.name },
    privacy_suppressed: false,
    minimum_cohort_size: minimumCohortSize,
    total_students: students.length,
    verified_students: verifiedStudents.length,
    employment_rate: employmentRate !== null ? Math.round(employmentRate * 1000) / 1000 : null,
    employed_student_count: studentsWithContracts.length,
    top_skills: topSkills,
    aggregate_earnings: totalEarnings,
    released_milestone_count: releasedMilestoneCount,
    average_earnings_per_employed_student:
      studentsWithContracts.length ? Math.round((totalEarnings / studentsWithContracts.length) * 100) / 100 : null,

    // Fields consumed by the university analytics dashboard.
    active_projects: activeProjects,
    on_time_rate: onTimeRate,
  };
}

// Resolve the institution from the authenticated staff account on the server.
// This keeps the university dashboard scoped to its own institution and avoids
// trusting a university id supplied by the browser.
export async function getMyUniversityMetrics(requestingUser) {
  const university = await University.findOne({ contact_staff: requestingUser._id }).select("_id").lean();
  if (!university) throw new NotFoundError("No university is linked to this account");
  return getUniversityMetrics(university._id, requestingUser);
}

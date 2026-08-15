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

  const [totalUsers, totalStudents, totalClients, totalProjects, openProjects, activeContracts, totalPayments, totalRevenue] =
    await Promise.all([
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

  
  const studentsWithContracts = verifiedUserIds.length
    ? await Contract.distinct("student_id", {
        student_id: { $in: verifiedUserIds },
        status: { $in: ["active", "completed"] },
      })
    : [];
  const employmentRate = verifiedUserIds.length ? studentsWithContracts.length / verifiedUserIds.length : null;

  
  const skillCounts = new Map();
  for (const student of students) {
    for (const skill of student.skills || []) {
      const key = skill.name?.trim();
      if (!key) continue;
      skillCounts.set(key, (skillCounts.get(key) || 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
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

  return {
    university: { id: university._id, name: university.name },
    total_students: students.length,
    verified_students: verifiedStudents.length,
    employment_rate: employmentRate !== null ? Math.round(employmentRate * 1000) / 1000 : null,
    employed_student_count: studentsWithContracts.length,
    top_skills: topSkills,
    aggregate_earnings: totalEarnings,
    released_milestone_count: releasedMilestoneCount,
    average_earnings_per_employed_student:
      studentsWithContracts.length ? Math.round((totalEarnings / studentsWithContracts.length) * 100) / 100 : null,
  };
}
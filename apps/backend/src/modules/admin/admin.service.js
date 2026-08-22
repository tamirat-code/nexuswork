import User from "../users/users.model.js";
import Dispute from "../disputes/disputes.model.js";
import Milestone from "../milestones/milestones.model.js";
import Contract from "../contracts/contracts.model.js";
import Payment from "../payments/payments.model.js";
import Withdrawal from "../wallets/withdrawal.model.js";
import AdminAction from "./admin.model.js";
import AuditLog from "../audit-logs/audit-logs.model.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { paymentConfig } from "../../config/payment.config.js";


export async function suspendUser(admin_id, admin_role, user_id, reason) {
  const user = await User.findById(user_id);
  if (!user) throw new NotFoundError("User not found");

  if (user.role === ROLES.ADMIN && admin_role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can suspend other admins");
  }

  user.status = "suspended";
  user.suspension_reason = reason;
  user.suspended_at = new Date();
  user.suspended_by = admin_id;
  await user.save();

  await logAction({
    actor_id: admin_id,
    actor_role: admin_role,
    action_type: "user_suspended",
    entity_type: "user",
    entity_id: user_id,
    reason,
    details: { suspended_at: new Date() },
  });

  return user;
}


export async function restoreUser(admin_id, admin_role, user_id, reason) {
  const user = await User.findById(user_id);
  if (!user) throw new NotFoundError("User not found");

  user.status = "active";
  user.suspension_reason = null;
  user.suspended_at = null;
  user.suspended_by = null;
  await user.save();

  await logAction({
    actor_id: admin_id,
    actor_role: admin_role,
    action_type: "user_restored",
    entity_type: "user",
    entity_id: user_id,
    reason,
  });

  return user;
}


export async function deleteUser(admin_id, admin_role, user_id, reason) {
  const user = await User.findById(user_id);
  if (!user) throw new NotFoundError("User not found");

  if (user._id.toString() === admin_id.toString()) {
    throw new ValidationError("Cannot delete yourself");
  }

  
  const deletedUser = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    deleted_at: new Date(),
  };

  await User.findByIdAndDelete(user_id);

  await logAction({
    actor_id: admin_id,
    actor_role: admin_role,
    action_type: "user_deleted",
    entity_type: "user",
    entity_id: user_id,
    reason,
    details: deletedUser,
  });

  return { success: true, deleted_user: deletedUser };
}


export async function listUsers({ role, status, search, limit = 50, skip = 0 }) {
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password_hash")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    limit,
    skip,
    pages: Math.ceil(total / limit),
  };
}


export async function getUserProfile(user_id) {
  const user = await User.findById(user_id).select("-password_hash").lean();
  if (!user) throw new NotFoundError("User not found");

  // Get recent audit entries for this user
  const recentActions = await AuditLog.find({
    $or: [
      { entity_type: "user", entity_id: user_id },
      { actor_id: user_id },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    ...user,
    recent_actions: recentActions,
  };
}


export async function updateUserRole(admin_id, admin_role, user_id, new_role, reason) {
  if (admin_role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can change user roles");
  }

  const user = await User.findById(user_id);
  if (!user) throw new NotFoundError("User not found");

  const old_role = user.role;
  user.role = new_role;
  await user.save();

  await logAction({
    actor_id: admin_id,
    actor_role: admin_role,
    action_type: "user_role_changed",
    entity_type: "user",
    entity_id: user_id,
    reason,
    details: { old_role, new_role },
  });

  return user;
}


export async function listDisputes({ status, limit = 50, skip = 0 }) {
  const query = status ? { status } : {};

  const [disputes, total] = await Promise.all([
    Dispute.find(query)
      .populate("milestone_id")
      .populate("opened_by", "name email")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean(),
    Dispute.countDocuments(query),
  ]);

  return { disputes, total, limit, skip };
}

/**
 * Resolve a dispute with admin decision.
 */
export async function resolveDispute(admin_id, admin_role, dispute_id, resolution, outcome) {
  const dispute = await Dispute.findById(dispute_id);
  if (!dispute) throw new NotFoundError("Dispute not found");

  
  if (outcome === "resume_work") {
    const milestone = await Milestone.findById(dispute.milestone_id);
    if (milestone && milestone.status === "disputed") {
      milestone.status = dispute.pre_dispute_status || "funded";
      await milestone.save();
    }
  }

  dispute.status = "resolved";
  dispute.resolution_summary = resolution;
  dispute.resolved_by = admin_id;
  dispute.resolved_at = new Date();
  dispute.outcome = outcome; // e.g., 'client_favored', 'freelancer_favored', 'split', 'resume_work'
  await dispute.save();

  await logAction({
    actor_id: admin_id,
    actor_role: admin_role,
    action_type: "dispute_resolved",
    entity_type: "dispute",
    entity_id: dispute_id,
    reason: resolution,
    details: { outcome },
  });

  return dispute;
}

/**
 * Get platform admin dashboard statistics, including real commission
 * revenue pulled from the Payment ledger (direction: "commission").
 */
export async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    users_total,
    users_active,
    students_total,
    clients_total,
    projects_active,
    disputes_open,
    disputes_resolved,
    commissionTotalAgg,
    commission30dAgg,
    withdrawnTotalAgg,
    monthlyCommissionAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active", last_login: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.CLIENT }),
    Contract.countDocuments({ status: "active" }),
    Dispute.countDocuments({ status: "open" }),
    Dispute.countDocuments({ status: "resolved", resolved_at: { $gte: thirtyDaysAgo } }),
    Payment.aggregate([
      { $match: { direction: "commission", status: "succeeded" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          direction: "commission",
          status: "succeeded",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Withdrawal.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          direction: "commission",
          status: "succeeded",
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]),
  ]);

  const user_breakdown = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const commission_total = Number(commissionTotalAgg[0]?.total || 0);
  const commission_30d = Number(commission30dAgg[0]?.total || 0);
  const total_withdrawn = Number(withdrawnTotalAgg[0]?.total || 0);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthly_commission = monthlyCommissionAgg.map((row) => ({
    label: `${monthNames[row._id.m - 1]} ${String(row._id.y).slice(2)}`,
    total: Number(row.total || 0),
  }));

  return {
    users: {
      total: users_total,
      active_30d: users_active,
      by_role: user_breakdown,
    },
    students: students_total,
    clients: clients_total,
    active_projects: projects_active,
    disputes: {
      open: disputes_open,
      resolved_30d: disputes_resolved,
    },
    revenue: {
      commission_total,
      commission_30d,
      total_withdrawn,
      currency: paymentConfig.currency,
      monthly: monthly_commission,
    },
  };
}
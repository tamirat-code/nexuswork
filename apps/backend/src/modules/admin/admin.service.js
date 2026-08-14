import User from "../users/users.model.js";
import Dispute from "../disputes/disputes.model.js";
import AdminAction from "./admin.model.js";
import AuditLog from "../audit-logs/audit-logs.model.js";
import { logAction } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";

/**
 * Suspend a user account (prevent login and activity).
 */
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

/**
 * Restore a suspended user.
 */
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

/**
 * Permanently delete a user and their data (with financial audit trail preserved).
 */
export async function deleteUser(admin_id, admin_role, user_id, reason) {
  const user = await User.findById(user_id);
  if (!user) throw new NotFoundError("User not found");

  if (user._id.toString() === admin_id.toString()) {
    throw new ValidationError("Cannot delete yourself");
  }

  // Store deletion record before removing
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

/**
 * List all users with optional filtering.
 */
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

/**
 * Get detailed user profile with activity history.
 */
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

/**
 * Update user role (admin privilege).
 */
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

/**
 * Get all open disputes for admin review.
 */
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

  dispute.status = "resolved";
  dispute.resolution_summary = resolution;
  dispute.resolved_by = admin_id;
  dispute.resolved_at = new Date();
  dispute.outcome = outcome; // e.g., 'client_favored', 'freelancer_favored', 'split'
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
 * Get platform admin dashboard statistics.
 */
export async function getDashboardStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const [users_total, users_active, disputes_open, disputes_resolved] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active", last_login: { $gte: thirtyDaysAgo } }),
    Dispute.countDocuments({ status: "open" }),
    Dispute.countDocuments({ status: "resolved", resolved_at: { $gte: thirtyDaysAgo } }),
  ]);

  const user_breakdown = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    users: {
      total: users_total,
      active_30d: users_active,
      by_role: user_breakdown,
    },
    disputes: {
      open: disputes_open,
      resolved_30d: disputes_resolved,
    },
  };
}

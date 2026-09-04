import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import {
  listUsers,
  getUserProfile,
  suspendUser,
  restoreUser,
  deleteUser,
  updateUserRole,
  listDisputes,
  resolveDispute,
  getDashboardStats,
} from "./admin.service.js";
import { listReports, reviewReport } from "../safety/safety.service.js";

/**
 * Get admin dashboard with platform statistics.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can access the dashboard");
  }
  const stats = await getDashboardStats();
  res.json({ success: true, data: stats });
});

/**
 * List users (with optional filtering by role, status, search).
 */
export const getUsers = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, "moderator"].includes(req.user.role)) {
    throw new ForbiddenError("Only admins and moderators can list users");
  }

  const result = await listUsers({
    role: req.query.role,
    status: req.query.status,
    university: req.query.university,
    search: req.query.search,
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
  });
  res.json({ success: true, data: result });
});

/**
 * Get detailed user profile.
 */
export const getUser = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, "moderator"].includes(req.user.role)) {
    throw new ForbiddenError("Only admins and moderators can view user details");
  }
  const profile = await getUserProfile(req.params.userId);
  res.json({ success: true, data: profile });
});

/**
 * Suspend a user.
 */
export const suspend = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can suspend users");
  }
  requireFields(req.body, ["reason"]);

  const user = await suspendUser(req.user._id, req.user.role, req.params.userId, req.body.reason);
  res.json({ success: true, data: user });
});

/**
 * Restore a suspended user.
 */
export const restore = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can restore users");
  }
  requireFields(req.body, ["reason"]);

  const user = await restoreUser(req.user._id, req.user.role, req.params.userId, req.body.reason);
  res.json({ success: true, data: user });
});

/**
 * Delete a user permanently.
 */
export const remove = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can delete users");
  }
  requireFields(req.body, ["reason"]);

  const result = await deleteUser(req.user._id, req.user.role, req.params.userId, req.body.reason);
  res.json({ success: true, data: result });
});

/**
 * Change a user's role.
 */
export const updateRole = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can change user roles");
  }
  requireFields(req.body, ["new_role", "reason"]);

  const user = await updateUserRole(
    req.user._id,
    req.user.role,
    req.params.userId,
    req.body.new_role,
    req.body.reason
  );
  res.json({ success: true, data: user });
});

/**
 * List all disputes (open and resolved).
 */
export const getDisputes = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, "moderator"].includes(req.user.role)) {
    throw new ForbiddenError("Only admins and moderators can view disputes");
  }

  const result = await listDisputes({
    status: req.query.status,
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
  });
  res.json({ success: true, data: result });
});

/**
 * Resolve a dispute.
 */
export const resolveDisputeHandler = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can resolve disputes");
  }
  requireFields(req.body, ["resolution", "outcome"]);

  const dispute = await resolveDispute(
    req.user._id,
    req.user.role,
    req.params.disputeId,
    req.body.resolution,
    req.body.outcome
  );
  res.json({ success: true, data: dispute });
});

export const getReports = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can view user reports");
  res.json({ success: true, data: await listReports({ status: req.query.status, limit: req.query.limit, skip: req.query.skip }) });
});

export const reviewUserReport = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) throw new ForbiddenError("Only admins can review user reports");
  res.json({ success: true, data: await reviewReport(req.params.reportId, req.user._id, req.body.status, req.body.review_note) });
});

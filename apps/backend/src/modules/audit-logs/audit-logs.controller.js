import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import {
  listLogs,
  getEntityHistory,
  flagForReview,
  getAuditSummary,
} from "./audit-logs.service.js";

/**
 * List audit log entries (admin/moderator only).
 * Query params: action_type, entity_type, entity_id, limit, skip, status, start_date, end_date
 */
export const list = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, "moderator"].includes(req.user.role)) {
    throw new ForbiddenError("Only admins and moderators can view audit logs");
  }

  const result = await listLogs({
    action_type: req.query.action_type,
    entity_type: req.query.entity_type,
    entity_id: req.query.entity_id,
    limit: parseInt(req.query.limit) || 50,
    skip: parseInt(req.query.skip) || 0,
    status: req.query.status,
    start_date: req.query.start_date,
    end_date: req.query.end_date,
  });

  res.json({ success: true, data: result });
});

/**
 * Get history of all audit entries related to a specific entity.
 * entity_type: user, contract, dispute, payment, etc.
 * entity_id: MongoDB object ID
 */
export const getHistory = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, "moderator"].includes(req.user.role)) {
    throw new ForbiddenError("Only admins and moderators can view audit logs");
  }

  const { entity_type, entity_id } = req.params;
  const history = await getEntityHistory(entity_type, entity_id);
  res.json({ success: true, data: history });
});

/**
 * Flag an audit log entry for manual review.
 */
export const flag = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can flag audit entries");
  }

  const { id } = req.params;
  const { reason } = req.body;
  const flagged = await flagForReview(id, {
    reviewer: req.user,
    reason,
    correlationId: req.correlationId,
  });
  res.json({ success: true, data: flagged });
});

/**
 * Get audit activity summary/statistics.
 */
export const getSummary = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.ADMIN) {
    throw new ForbiddenError("Only admins can view audit summary");
  }

  const days = parseInt(req.query.days) || 30;
  const summary = await getAuditSummary(days);
  res.json({ success: true, data: summary });
});

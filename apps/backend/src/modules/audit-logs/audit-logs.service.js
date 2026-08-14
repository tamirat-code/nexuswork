import AuditLog from "./audit-logs.model.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ForbiddenError, NotFoundError } from "../../shared/exceptions/AppError.js";

/**
 * Log an administrative or financial action to the append-only audit log.
 * This function enforces append-only semantics and is the exclusive way to create audit entries.
 */
export async function logAction({
  actor_id,
  actor_role,
  action_type,
  entity_type,
  entity_id,
  reason,
  details,
  ip_address,
  user_agent,
  related_entity_type,
  related_entity_id,
}) {
  const entry = new AuditLog({
    actor_id,
    actor_role,
    action_type,
    entity_type,
    entity_id,
    reason,
    details,
    ip_address,
    user_agent,
    related_entity_type,
    related_entity_id,
    status: "logged",
  });
  return entry.save();
}

/**
 * Retrieve audit logs with pagination and filtering.
 * Admin/moderator only.
 */
export async function listLogs({
  actor_role,
  action_type,
  entity_type,
  entity_id,
  limit = 50,
  skip = 0,
  status,
  start_date,
  end_date,
}) {
  const query = {};

  if (action_type) query.action_type = action_type;
  if (entity_type) query.entity_type = entity_type;
  if (entity_id) query.entity_id = entity_id;
  if (status) query.status = status;

  if (start_date || end_date) {
    query.createdAt = {};
    if (start_date) query.createdAt.$gte = new Date(start_date);
    if (end_date) query.createdAt.$lte = new Date(end_date);
  }

  const [entries, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("actor_id", "email name")
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    entries,
    total,
    limit,
    skip,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Get all audit entries for a specific entity (e.g., all logs related to a user).
 */
export async function getEntityHistory(entity_type, entity_id) {
  const query = {
    $or: [
      { entity_type, entity_id },
      { related_entity_type: entity_type, related_entity_id: entity_id },
    ],
  };

  return AuditLog.find(query)
    .sort({ createdAt: -1 })
    .populate("actor_id", "email name")
    .lean();
}

/**
 * Flag a log entry for manual review (e.g., suspicious pattern detected).
 */
export async function flagForReview(log_id, reason) {
  const entry = await AuditLog.findByIdAndUpdate(
    log_id,
    { status: "flagged_for_review", flagged_reason: reason },
    { new: true }
  );
  if (!entry) throw new NotFoundError("Audit log entry not found");
  return entry;
}

/**
 * Get summary statistics about audit activity (for dashboard).
 */
export async function getAuditSummary(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const pipeline = [
    { $match: { createdAt: { $gte: since } } },
    {
      $facet: {
        by_action: [
          { $group: { _id: "$action_type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        by_actor: [
          { $group: { _id: "$actor_id", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        by_entity: [
          { $group: { _id: "$entity_type", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        flagged_count: [
          { $match: { status: "flagged_for_review" } },
          { $count: "total" },
        ],
        total: [{ $count: "total" }],
      },
    },
  ];

  const [summary] = await AuditLog.aggregate(pipeline);
  return summary || {};
}

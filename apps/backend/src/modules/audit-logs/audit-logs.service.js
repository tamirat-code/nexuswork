import crypto from "node:crypto";
import AuditLog from "./audit-logs.model.js";
import AuditReview from "./audit-review.model.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

const VALID_ACTOR_ROLES = new Set([
  "admin", "moderator", "client", "student", "university_staff", "system",
]);

function normalizeActor(actor) {
  if (!actor) return { actor_id: undefined, actor_role: "system" };
  const actorId = actor.id || actor._id;
  const actorRole = actor.role;
  if (!actorRole || !VALID_ACTOR_ROLES.has(actorRole)) {
    throw new ValidationError("Invalid audit actor role");
  }
  if (actorRole !== "system" && !actorId) {
    throw new ValidationError("Audit actor identity is required");
  }
  return { actor_id: actorId || undefined, actor_role: actorRole };
}

/** Server-only API. Actor and event fields are supplied by trusted backend code. */
export async function recordEvent({
  actor,
  eventType,
  action,
  entityType,
  entityId,
  previousState = null,
  newState = null,
  correlationId,
  requestId,
  metadata = {},
  reason,
  status = "logged",
  relatedEntityType,
  relatedEntityId,
  ipAddress,
  userAgent,
}) {
  if (!eventType || !action || !entityType || !entityId) {
    throw new ValidationError("eventType, action, entityType, and entityId are required for audit events");
  }
  if (!correlationId) throw new ValidationError("correlationId is required for audit events");

  const normalizedActor = normalizeActor(actor);
  const eventId = crypto.randomUUID();

  return AuditLog.create({
    eventId,
    eventType,
    action,
    previousState,
    newState,
    metadata,
    requestId: requestId || correlationId,
    correlationId,
    ...normalizedActor,
    action_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    related_entity_type: relatedEntityType,
    related_entity_id: relatedEntityId,
    reason,
    details: metadata,
    ip_address: ipAddress,
    user_agent: userAgent,
    status,
  });
}

/** Compatibility adapter for existing internal logAction callers. */
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
  eventType,
  action,
  previousState,
  newState,
  metadata,
  correlationId,
  requestId,
  status,
}) {
  return recordEvent({
    actor: actor_id || actor_role ? { id: actor_id, role: actor_role || "system" } : { role: "system" },
    eventType: eventType || action_type,
    action: action || action_type,
    entityType: entity_type,
    entityId: entity_id,
    previousState,
    newState,
    correlationId: correlationId || crypto.randomUUID(),
    requestId,
    metadata: metadata || details || {},
    reason,
    status,
    relatedEntityType: related_entity_type,
    relatedEntityId: related_entity_id,
    ipAddress: ip_address,
    userAgent: user_agent,
  });
}

export async function listLogs({ actor_role, action_type, entity_type, entity_id, limit = 50, skip = 0, status, start_date, end_date }) {
  const query = {};
  if (actor_role) query.actor_role = actor_role;
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
    AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).populate("actor_id", "email name").lean(),
    AuditLog.countDocuments(query),
  ]);
  return { entries, total, limit, skip, pages: Math.ceil(total / limit) };
}

export async function getEntityHistory(entity_type, entity_id) {
  return AuditLog.find({
    $or: [
      { entity_type, entity_id },
      { related_entity_type: entity_type, related_entity_id: entity_id },
    ],
  }).sort({ createdAt: -1 }).populate("actor_id", "email name").lean();
}

/** Creates a separate review record; the original audit event is never mutated. */
export async function flagForReview(log_id, { reviewer, reason, correlationId } = {}) {
  if (!reason) throw new ValidationError("A reason is required to flag an audit event");
  const entry = await AuditLog.findById(log_id).select("_id").lean();
  if (!entry) throw new NotFoundError("Audit log entry not found");

  const actor = normalizeActor(reviewer);
  if (!["admin", "moderator"].includes(actor.actor_role)) {
    throw new ForbiddenError("Only admins and moderators can flag audit entries");
  }

  return AuditReview.create({
    audit_log_id: entry._id,
    reviewer_id: actor.actor_id,
    reviewer_role: actor.actor_role,
    reason,
    correlationId: correlationId || crypto.randomUUID(),
  });
}

export async function getAuditSummary(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const pipeline = [{ $match: { createdAt: { $gte: since } } }, { $facet: {
    by_action: [{ $group: { _id: "$action_type", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
    by_actor: [{ $group: { _id: "$actor_id", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }],
    by_entity: [{ $group: { _id: "$entity_type", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
    total: [{ $count: "total" }],
  } }];
  const [summary, flaggedCount] = await Promise.all([
    AuditLog.aggregate(pipeline),
    AuditReview.countDocuments({ createdAt: { $gte: since } }),
  ]);
  return { ...(summary[0] || {}), flagged_count: [{ total: flaggedCount }] };
}

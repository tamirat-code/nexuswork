import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { trackEvent, getPlatformMetrics, getUserMetrics, getUniversityMetrics, getMyUniversityMetrics } from "./analytics.service.js";

export const postEvent = asyncHandler(async (req, res) => {
  requireFields(req.body, ["event_type"]);
  const event = await trackEvent({
    userId: req.user?._id,
    eventType: req.body.event_type,
    entityType: req.body.entity_type,
    entityId: req.body.entity_id,
    metadata: req.body.metadata,
  });
  res.status(201).json({ success: true, data: event });
});

export const getPlatform = asyncHandler(async (req, res) => {
  const metrics = await getPlatformMetrics({ days: req.query.days });
  res.json({ success: true, data: metrics });
});

export const getMine = asyncHandler(async (req, res) => {
  const metrics = await getUserMetrics(req.user._id);
  res.json({ success: true, data: metrics });
});

export const getUniversity = asyncHandler(async (req, res) => {
  const metrics = await getUniversityMetrics(req.params.universityId, req.user);
  res.json({ success: true, data: metrics });
});

export const getMyUniversity = asyncHandler(async (req, res) => {
  const metrics = await getMyUniversityMetrics(req.user);
  res.json({ success: true, data: metrics });
});

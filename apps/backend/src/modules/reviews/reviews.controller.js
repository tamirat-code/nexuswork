import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import {
  submitReview,
  listForUser,
  getReputationScore,
  exportReputation,
  verifyReputationExport,
  getReputationCredentialStatus,
  updateReputationCredentialStatus,
} from "./reviews.service.js";
import User from "../users/users.model.js";
import { env } from "../../config/env.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";

export const create = asyncHandler(async (req, res) => {
  requireFields(req.body, ["reviewee_id", "rating"]);
  const review = await submitReview(req.params.contractId, req.user._id, req.body);
  res.status(201).json({ success: true, data: review });
});

export const getForUser = asyncHandler(async (req, res) => {
  const reviews = await listForUser(req.params.userId, {
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: reviews });
});

export const getReputation = asyncHandler(async (req, res) => {
  const reputation = await getReputationScore(req.params.userId);
  res.json({ success: true, data: reputation });
});

export const exportReputationCredential = asyncHandler(async (req, res) => {
  const document = await exportReputation(req.params.userId, req.user._id);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="nexuswork-reputation-${req.params.userId}.json"`);
  res.json(document);
});

export const verifyReputationCredential = asyncHandler(async (req, res) => {
  const document = req.body?.document ?? req.body;
  const result = verifyReputationExport(document);
  const status = result.valid ? await getReputationCredentialStatus(document) : null;
  const effectiveResult = status?.status && status.status !== "active"
    ? { valid: false, reason: `Reputation credential is ${status.status}${status.reason ? `: ${status.reason}` : ""}` }
    : result;
  res.json({
    success: true,
    data: {
      ...effectiveResult,
      credentialStatus: status?.status || document?.credentialStatus?.status || null,
      version: document?.version || null,
      subject: document?.credentialSubject?.id || null,
      issuer: document?.issuer?.name || null,
      issuedAt: document?.issuedAt || document?.proof?.created || null,
      ratings: Array.isArray(document?.ratings) ? document.ratings.length : 0,
      deliveryMetrics: Array.isArray(document?.deliveryMetrics) ? document.deliveryMetrics.length : 0,
      credentials: Array.isArray(document?.credentials) ? document.credentials.length : 0,
    },
  });
});

export const updateReputationStatus = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") throw new ForbiddenError("Only administrators can change reputation credential status");
  const subject = await User.findById(req.params.userId).select("_id").lean();
  if (!subject) return res.status(404).json({ success: false, message: "Reputation subject not found" });
  const credentialId = `${env.credentialIssuerUrl}/v1/reviews/user/${req.params.userId}/reputation/export`;
  const status = await updateReputationCredentialStatus({ credentialId, subjectId: subject._id, status: req.body.status, reason: req.body.reason, changedBy: req.user._id });
  res.json({ success: true, data: status });
});

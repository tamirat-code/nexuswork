import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import {
  createPartner, listPartners, getPartner, listPartnerKeys, createPartnerKey, revokePartnerKey, updatePartnerStatus,
} from "./api-partners.service.js";
import { getCurrentPartnerUsage } from "./api-usage.service.js";
import { searchTalent } from "./talent-api.service.js";

function requireAdmin(req) {
  if (req.user?.role !== "admin") throw new ForbiddenError("Only administrators can manage API partners");
}

export const create = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.status(201).json({ success: true, data: await createPartner({ actor: req.user, payload: req.body, req }) });
});

export const list = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await listPartners() });
});

export const get = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await getPartner(req.params.partnerId) });
});

export const keys = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await listPartnerKeys(req.params.partnerId) });
});

export const createKey = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.status(201).json({ success: true, data: await createPartnerKey({ partnerId: req.params.partnerId, payload: req.body, actor: req.user, req }) });
});

export const revokeKey = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await revokePartnerKey({ partnerId: req.params.partnerId, keyId: req.params.keyId, actor: req.user, req }) });
});

export const updateStatus = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await updatePartnerStatus({ partnerId: req.params.partnerId, ...req.body, actor: req.user, req }) });
});

export const profile = asyncHandler(async (req, res) => {
  const partner = await getPartner(req.apiPartner._id);
  res.json({ success: true, data: { ...partner, usage: req.apiUsage || await getCurrentPartnerUsage(req.apiPartner) } });
});

export const talentSearch = asyncHandler(async (req, res) => {
  const data = await searchTalent({ partner: req.apiPartner, query: req.validatedQuery, req });
  res.json({ success: true, data });
});

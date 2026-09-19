import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { ForbiddenError } from "../../shared/exceptions/AppError.js";
import {
  createPartner, listPartners, getPartner, listPartnerKeys, createPartnerKey, revokePartnerKey, updatePartnerStatus,
    submitPartnerApplication, approvePartnerApplication,
  listOwnPartnerKeys, createOwnPartnerKey, revokeOwnPartnerKey, updatePartnerBillingMode,
} from "./api-partners.service.js";
import { getCurrentPartnerUsage } from "./api-usage.service.js";
import { searchTalent } from "./talent-api.service.js";
import { getPartnerBilling, listPartnerBilling, updatePartnerBillingStatus } from "./api-billing.service.js";
import { createStripeBillingSetupIntent, saveStripePaymentMethod, chargePartnerUsageStatement, createEtbWalletTopUp } from "./api-billing-payments.service.js";
import {
  createWebhookSubscription, listWebhookSubscriptions, updateWebhookSubscription, rotateWebhookSecret,
  disableWebhookSubscription, listWebhookDeliveries,
} from "./api-webhooks.service.js";

function requireAdmin(req) {
  if (req.user?.role !== "admin") throw new ForbiddenError("Only administrators can manage API partners");
}

export const create = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.status(201).json({ success: true, data: await createPartner({ actor: req.user, payload: req.body, req }) });
});

export const apply = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await submitPartnerApplication({ actor: req.user, payload: req.body, req }) });
});

export const approve = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await approvePartnerApplication({ partnerId: req.params.partnerId, actor: req.user, req }) });
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

export const selfKeys = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listOwnPartnerKeys(req.apiPartner._id) });
});

export const selfCreateKey = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createOwnPartnerKey({ partnerId: req.apiPartner._id, payload: req.body, req }) });
});

export const selfRevokeKey = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await revokeOwnPartnerKey({ partnerId: req.apiPartner._id, keyId: req.params.keyId, req }) });
});

export const usage = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getCurrentPartnerUsage(req.apiPartner) });
});

export const billing = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getPartnerBilling(req.apiPartner) });
});

export const billingHistory = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listPartnerBilling(req.params.partnerId, req.validatedQuery.limit) });
});

export const adminBilling = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await listPartnerBilling(req.params.partnerId, req.validatedQuery.limit) });
});

export const updateBillingStatus = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await updatePartnerBillingStatus({ partnerId: req.params.partnerId, ledgerId: req.params.ledgerId, ...req.body, actor: req.user, req }) });
});

export const updateBillingMode = asyncHandler(async (req, res) => {
  requireAdmin(req);
  res.json({ success: true, data: await updatePartnerBillingMode({ partnerId: req.params.partnerId, billingMode: req.body.billing_mode, actor: req.user, req }) });
});

export const billingSetupIntent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await createStripeBillingSetupIntent({ partnerId: req.params.partnerId, actor: req.user, req }) });
});

export const billingPaymentMethod = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await saveStripePaymentMethod({ partnerId: req.params.partnerId, paymentMethodId: req.body.payment_method_id, actor: req.user, req }) });
});

export const chargeBilling = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await chargePartnerUsageStatement({ ledgerId: req.params.ledgerId, actor: req.user, req }) });
});

export const walletTopUp = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createEtbWalletTopUp({ partnerId: req.params.partnerId, amountMinor: req.body.amount_minor, actor: req.user }) });
});

export const webhooks = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listWebhookSubscriptions(req.apiPartner._id) });
});

export const createWebhook = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await createWebhookSubscription({ partnerId: req.apiPartner._id, ...req.body }) });
});

export const updateWebhook = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateWebhookSubscription({ partnerId: req.apiPartner._id, subscriptionId: req.params.subscriptionId, ...req.body }) });
});

export const rotateWebhook = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await rotateWebhookSecret({ partnerId: req.apiPartner._id, subscriptionId: req.params.subscriptionId }) });
});

export const disableWebhook = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await disableWebhookSubscription({ partnerId: req.apiPartner._id, subscriptionId: req.params.subscriptionId }) });
});

export const webhookDeliveries = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listWebhookDeliveries(req.apiPartner._id, req.validatedQuery.limit) });
});

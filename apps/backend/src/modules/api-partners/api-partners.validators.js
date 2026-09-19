import { z } from "zod";
import { email, objectId } from "../../shared/validators/schemas.js";
import { API_PARTNER_SCOPES, API_PARTNER_TIERS } from "./api-partners.model.js";

const scope = z.enum(API_PARTNER_SCOPES);

export const createPartnerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  organization_name: z.string().trim().max(200).optional(),
  contact_email: email,
  tier: z.enum(API_PARTNER_TIERS).default("sandbox"),
  scopes: z.array(scope).min(1).default(["talent:read", "usage:read"]),
});

export const submitPartnerApplicationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  organization_name: z.string().trim().max(200).optional(),
  contact_email: email,
  tier: z.enum(API_PARTNER_TIERS).default("sandbox"),
  scopes: z.array(scope).min(1).default(["talent:read", "usage:read"]),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(scope).min(1).optional(),
  expires_at: z.coerce.date().optional().nullable(),
});

export const updatePartnerStatusSchema = z.object({
  status: z.enum(["active", "suspended", "revoked", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

export const apiPartnerParamsSchema = z.object({ partnerId: objectId });
export const apiKeyParamsSchema = z.object({ partnerId: objectId, keyId: objectId });
export const ownKeyParamsSchema = z.object({ keyId: objectId });

export const talentSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  skills: z.string().trim().max(1000).optional().default(""),
  institution_ids: z.string().trim().max(1000).optional().default(""),
  fields: z.string().trim().max(500).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).max(100000).default(0),
});

export const createWebhookSubscriptionSchema = z.object({
  url: z.string().trim().url().max(2000),
  events: z.array(z.enum(["talent.consent.updated", "usage.threshold"])).min(1).max(10),
});

export const updateWebhookSubscriptionSchema = z.object({
  url: z.string().trim().url().max(2000).optional(),
  events: z.array(z.enum(["talent.consent.updated", "usage.threshold"])).min(1).max(10).optional(),
  status: z.enum(["active", "disabled"]).optional(),
}).refine((payload) => Object.keys(payload).length > 0, "Provide at least one webhook setting to update");

export const webhookParamsSchema = z.object({ subscriptionId: objectId });
export const partnerLimitQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });
export const apiBillingStatusParamsSchema = z.object({ partnerId: objectId, ledgerId: objectId });
export const updateApiBillingStatusSchema = z.object({
  status: z.enum(["issued", "paid", "failed", "overdue", "void"]),
  settlement_reference: z.string().trim().max(200).optional(),
  settlement_error: z.string().trim().max(500).optional(),
}).superRefine((payload, context) => {
  if (payload.status === "paid" && !payload.settlement_reference) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["settlement_reference"], message: "Settlement reference is required when marking an invoice paid" });
  }
  if (payload.status === "failed" && !payload.settlement_error) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["settlement_error"], message: "Settlement error is required when marking an invoice failed" });
  }
});

export const stripePaymentMethodSchema = z.object({
  payment_method_id: z.string().trim().min(3).max(200),
});

export const apiWalletTopUpSchema = z.object({
  amount_minor: z.coerce.number().int().min(100),
});

export const apiBillingModeSchema = z.object({
  billing_mode: z.enum(["manual", "prepaid_etb", "stripe_usage"]),
});

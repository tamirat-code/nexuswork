import { z } from "zod";
import { email, objectId } from "../../shared/validators/schemas.js";
import { API_PARTNER_SCOPES, API_PARTNER_TIERS } from "./api-partners.model.js";

const scope = z.enum(API_PARTNER_SCOPES);

export const createPartnerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  organization_name: z.string().trim().max(200).optional(),
  contact_email: email,
  tier: z.enum(API_PARTNER_TIERS).default("sandbox"),
  scopes: z.array(scope).min(1).default(["talent:read"]),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(120),
  scopes: z.array(scope).min(1).optional(),
  expires_at: z.coerce.date().optional().nullable(),
});

export const updatePartnerStatusSchema = z.object({
  status: z.enum(["active", "suspended", "revoked"]),
  reason: z.string().trim().max(500).optional(),
});

export const apiPartnerParamsSchema = z.object({ partnerId: objectId });
export const apiKeyParamsSchema = z.object({ partnerId: objectId, keyId: objectId });

export const talentSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  skills: z.string().trim().max(1000).optional().default(""),
  institution_ids: z.string().trim().max(1000).optional().default(""),
  fields: z.string().trim().max(500).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).max(100000).default(0),
});

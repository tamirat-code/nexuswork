import crypto from "node:crypto";
import ApiPartner, { API_PARTNER_SCOPES } from "./api-partners.model.js";
import ApiKey from "./api-keys.model.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { env } from "../../config/env.js";
import { sendPartnerApiKeyEmail } from "../../shared/mailer/mailer.service.js";
import { logger } from "../../shared/logger/logger.js";

const TIER_DEFAULTS = Object.freeze({
  sandbox: { monthlyQuota: env.partnerSandboxMonthlyQuota, requestsPerMinute: env.partnerSandboxRequestsPerMinute, pricePerThousandMinor: env.partnerSandboxPricePerThousandMinor },
  growth: { monthlyQuota: env.partnerGrowthMonthlyQuota, requestsPerMinute: env.partnerGrowthRequestsPerMinute, pricePerThousandMinor: env.partnerGrowthPricePerThousandMinor },
  enterprise: { monthlyQuota: env.partnerEnterpriseMonthlyQuota, requestsPerMinute: env.partnerEnterpriseRequestsPerMinute, pricePerThousandMinor: env.partnerEnterprisePricePerThousandMinor },
});

export function tierEtbPricing(tier) {
  return ({
    sandbox: env.partnerSandboxEtbPricePerThousandMinor,
    growth: env.partnerGrowthEtbPricePerThousandMinor,
    enterprise: env.partnerEnterpriseEtbPricePerThousandMinor,
  }[tier] || env.partnerSandboxEtbPricePerThousandMinor);
}

export async function updatePartnerBillingMode({ partnerId, billingMode, actor, req }) {
  if (actor?.role !== "admin") throw new ForbiddenError("Only administrators can change API billing mode");
  if (!["manual", "prepaid_etb", "stripe_usage"].includes(billingMode)) throw new ValidationError("Invalid API billing mode");
  const partner = await ApiPartner.findByIdAndUpdate(partnerId, { $set: { billing_mode: billingMode } }, { new: true });
  if (!partner) throw new NotFoundError("API partner not found");
  await audit(actor, "api_partner_billing_mode_updated", "api_partner.billing_mode_updated", "api_partner", partner._id, { billing_mode: billingMode }, req);
  return { ...partner.toObject(), ...tierLimits(partner.tier) };
}

export function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(String(apiKey)).digest("hex");
}

export function createApiKeyMaterial() {
  // Keep the identifier separator-safe. Base64url can contain `_`, which is
  // also the delimiter used by parseApiKey and makes the prefix ambiguous.
  const keyId = crypto.randomBytes(9).toString("hex");
  const secret = crypto.randomBytes(32).toString("base64url");
  const key = `nw_${keyId}_${secret}`;
  return { key, keyPrefix: `nw_${keyId}` };
}

export function parseApiKey(apiKey) {
  if (typeof apiKey !== "string") return null;
  // The key id is always 9 random bytes rendered as 18 hex characters.
  // Parse that fixed-width segment so underscores in the base64url secret do
  // not get absorbed into the key prefix.
  const match = /^nw_([a-f0-9]{18})_([A-Za-z0-9_-]{32,})$/.exec(apiKey.trim());
  if (!match) return null;
  return { keyPrefix: `nw_${match[1]}`, key: apiKey.trim() };
}

function auditContext(actor, req) {
  return {
    actor,
    requestId: req?.requestId || req?.correlationId,
    correlationId: req?.correlationId || req?.requestId || crypto.randomUUID(),
    ipAddress: req?.ip,
    userAgent: req?.get?.("user-agent"),
  };
}

async function audit(actor, eventType, action, entityType, entityId, metadata, req) {
  await recordEvent({
    ...auditContext(actor, req),
    eventType,
    action,
    entityType,
    entityId,
    metadata,
  });
}

function sanitizeKey(key) {
  return {
    _id: key._id,
    partner_id: key.partner_id,
    name: key.name,
    key_prefix: key.key_prefix,
    scopes: key.scopes,
    created_by: key.created_by,
    last_used_at: key.last_used_at,
    revoked_at: key.revoked_at,
    expires_at: key.expires_at,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
    active: !key.revoked_at && (!key.expires_at || key.expires_at > new Date()),
  };
}

function normalizedScopes(scopes, fallback = ["talent:read"]) {
  const values = [...new Set(scopes?.length ? scopes : fallback)];
  if (values.some((value) => !API_PARTNER_SCOPES.includes(value))) {
    throw new ValidationError("One or more API scopes are invalid");
  }
  return values;
}

export function tierLimits(tier) {
  const { monthlyQuota, requestsPerMinute } = TIER_DEFAULTS[tier] || TIER_DEFAULTS.sandbox;
  return { monthlyQuota, requestsPerMinute };
}

export function tierPricing(tier) {
  return (TIER_DEFAULTS[tier] || TIER_DEFAULTS.sandbox).pricePerThousandMinor;
}

export async function issueApiKey({ partner, name, scopes, expires_at, createdBy, req }) {
  const normalized = normalizedScopes(scopes, partner.scopes);
  if (normalized.some((scope) => !partner.scopes.includes(scope))) {
    throw new ValidationError("API key scopes cannot exceed the partner scopes");
  }
  if (expires_at && new Date(expires_at) <= new Date()) {
    throw new ValidationError("API key expiration must be in the future");
  }

  const { key, keyPrefix } = createApiKeyMaterial();
  const keyRecord = await ApiKey.create({
    partner_id: partner._id,
    name,
    key_prefix: keyPrefix,
    key_hash: hashApiKey(key),
    scopes: normalized,
    created_by: createdBy,
    expires_at: expires_at || undefined,
  });
  try {
    await audit(createdBy ? { id: createdBy, role: "admin" } : { role: "system" }, "api_key_created", "api_key.created", "api_key", keyRecord._id, { partner_id: partner._id, key_prefix: keyPrefix }, req);
  } catch (error) {
    await ApiKey.deleteOne({ _id: keyRecord._id });
    throw error;
  }
  return { key, keyRecord: sanitizeKey(keyRecord.toObject()) };
}

export async function createPartner({ actor, payload, req }) {
  const scopes = normalizedScopes(payload.scopes);
  const existing = await ApiPartner.findOne({ contact_email: payload.contact_email });
  if (existing) throw new ConflictError("An API partner with this contact email already exists", "API_PARTNER_EMAIL_EXISTS");

  const partner = await ApiPartner.create({
    ...payload,
    scopes,
    created_by: actor._id,
  });
  try {
    const issued = await issueApiKey({ partner, name: "Initial key", scopes, createdBy: actor._id, req });
    await audit(actor, "api_partner_created", "api_partner.created", "api_partner", partner._id, { tier: partner.tier, scopes }, req);
    let emailSent = false;
    try {
      await sendPartnerApiKeyEmail({
        to: partner.contact_email,
        partnerName: partner.name,
        apiKey: issued.key,
        tier: partner.tier,
        scopes,
      });
      emailSent = true;
    } catch (error) {
      logger.error(`[api-partners] initial key email failed for partner ${partner._id}:`, error.message);
    }
    return { partner: { ...partner.toObject(), ...tierLimits(partner.tier) }, api_key: issued.key, key: issued.keyRecord, email_sent: emailSent };
  } catch (error) {
    await ApiPartner.findByIdAndDelete(partner._id);
    throw error;
  }
}

export async function submitPartnerApplication({ actor, payload, req }) {
  if (!actor || !["client", "admin"].includes(actor.role)) {
    throw new ForbiddenError("Only client organization administrators can apply for partner access");
  }
  const scopes = normalizedScopes(payload.scopes);
  const existing = await ApiPartner.findOne({ contact_email: payload.contact_email });
  if (existing) throw new ConflictError("An API partner application already exists for this contact email", "API_PARTNER_APPLICATION_EXISTS");
  const partner = await ApiPartner.create({ ...payload, scopes, status: "pending", created_by: actor._id });
  await audit(actor, "api_partner_application_submitted", "api_partner.application_submitted", "api_partner", partner._id, { tier: partner.tier, scopes }, req);
  return { ...partner.toObject(), ...tierLimits(partner.tier) };
}

export async function approvePartnerApplication({ partnerId, actor, req }) {
  const partner = await ApiPartner.findById(partnerId);
  if (!partner) throw new NotFoundError("API partner not found");
  if (partner.status !== "pending") throw new ConflictError("Only pending partner applications can be approved");
  const issued = await issueApiKey({ partner, name: "Initial key", scopes: partner.scopes, createdBy: actor._id, req });
  const activated = await ApiPartner.findOneAndUpdate(
    { _id: partner._id, status: "pending" },
    { $set: { status: "active" }, $unset: { suspended_at: 1, suspended_reason: 1 } },
    { new: true }
  );
  if (!activated) {
    await ApiKey.deleteOne({ _id: issued.keyRecord._id, partner_id: partner._id, revoked_at: { $exists: false } });
    throw new ConflictError("Partner application changed before approval could complete");
  }
  let emailSent = false;
  try {
    await sendPartnerApiKeyEmail({
      to: activated.contact_email,
      partnerName: activated.name,
      apiKey: issued.key,
      tier: activated.tier,
      scopes: activated.scopes,
    });
    emailSent = true;
  } catch (error) {
    logger.error(`[api-partners] approved key email failed for partner ${activated._id}:`, error.message);
  }
  await audit(actor, "api_partner_approved", "api_partner.approved", "api_partner", partner._id, { scopes: partner.scopes }, req);
  return { partner: { ...activated.toObject(), ...tierLimits(activated.tier) }, api_key: issued.key, key: issued.keyRecord, email_sent: emailSent };
}

export async function listPartners() {
  const partners = await ApiPartner.find().sort({ createdAt: -1 }).lean();
  const keyCounts = await ApiKey.aggregate([{ $group: { _id: "$partner_id", count: { $sum: 1 } } }]);
  const counts = new Map(keyCounts.map((row) => [String(row._id), row.count]));
  return partners.map((partner) => ({ ...partner, ...tierLimits(partner.tier), key_count: counts.get(String(partner._id)) || 0 }));
}

export async function getPartner(partnerId) {
  const partner = await ApiPartner.findById(partnerId).lean();
  if (!partner) throw new NotFoundError("API partner not found");
  return { ...partner, ...tierLimits(partner.tier) };
}

export async function listPartnerKeys(partnerId) {
  if (!await ApiPartner.exists({ _id: partnerId })) throw new NotFoundError("API partner not found");
  const keys = await ApiKey.find({ partner_id: partnerId }).sort({ createdAt: -1 }).lean();
  return keys.map(sanitizeKey);
}

export async function createPartnerKey({ partnerId, payload, actor, req }) {
  const partner = await ApiPartner.findById(partnerId);
  if (!partner) throw new NotFoundError("API partner not found");
  if (partner.status !== "active") throw new ConflictError("Keys cannot be created for an inactive API partner");
  const issued = await issueApiKey({ partner, ...payload, createdBy: actor._id, req });
  let emailSent = false;
  try {
    await sendPartnerApiKeyEmail({
      to: partner.contact_email,
      partnerName: partner.name,
      apiKey: issued.key,
      tier: partner.tier,
      scopes: issued.keyRecord.scopes,
    });
    emailSent = true;
  } catch (error) {
    logger.error(`[api-partners] key email failed for partner ${partner._id}:`, error.message);
  }
  return { api_key: issued.key, key: issued.keyRecord, email_sent: emailSent };
}

export async function listOwnPartnerKeys(partnerId) {
  return listPartnerKeys(partnerId);
}

export async function createOwnPartnerKey({ partnerId, payload, req }) {
  const partner = await ApiPartner.findById(partnerId);
  if (!partner) throw new NotFoundError("API partner not found");
  if (partner.status !== "active") throw new ConflictError("Keys cannot be created for an inactive API partner");
  const issued = await issueApiKey({ partner, ...payload, createdBy: undefined, req });
  return { api_key: issued.key, key: issued.keyRecord };
}

export async function revokeOwnPartnerKey({ partnerId, keyId, req }) {
  const key = await ApiKey.findOne({ _id: keyId, partner_id: partnerId });
  if (!key) throw new NotFoundError("API key not found");
  if (!key.revoked_at) {
    key.revoked_at = new Date();
    await key.save();
    await audit({ role: "system" }, "api_key_revoked", "api_key.revoked", "api_key", key._id, { partner_id: partnerId, key_prefix: key.key_prefix }, req);
  }
  return sanitizeKey(key.toObject());
}

export async function revokePartnerKey({ partnerId, keyId, actor, req }) {
  const key = await ApiKey.findOne({ _id: keyId, partner_id: partnerId });
  if (!key) throw new NotFoundError("API key not found");
  if (!key.revoked_at) {
    key.revoked_at = new Date();
    await key.save();
    await audit(actor, "api_key_revoked", "api_key.revoked", "api_key", key._id, { partner_id: partnerId, key_prefix: key.key_prefix }, req);
  }
  return sanitizeKey(key.toObject());
}

export async function updatePartnerStatus({ partnerId, status, reason, actor, req }) {
  const partner = await ApiPartner.findById(partnerId);
  if (!partner) throw new NotFoundError("API partner not found");
  if (partner.status === "pending" && status === "active") {
    throw new ConflictError("Pending partner applications must be approved through the approval workflow");
  }
  if (partner.status === "pending" && status === "rejected" && !reason) {
    throw new ValidationError("A rejection reason is required for a pending partner application");
  }
  const previousStatus = partner.status;
  partner.status = status;
  partner.suspended_at = status === "suspended" ? new Date() : undefined;
  partner.suspended_reason = status === "suspended" ? reason : undefined;
  await partner.save();
  if (previousStatus !== status) {
    await audit(actor, `api_partner_${status}`, `api_partner.${status}`, "api_partner", partner._id, { previous_status: previousStatus, status, reason }, req);
  }
  return { ...partner.toObject(), ...tierLimits(partner.tier) };
}

export async function authenticateApiKey(rawApiKey) {
  const parsed = parseApiKey(rawApiKey);
  if (!parsed) return null;
  const key = await ApiKey.findOne({ key_prefix: parsed.keyPrefix }).select("+key_hash");
  if (!key || key.key_hash !== hashApiKey(parsed.key)) return null;
  if (key.revoked_at || (key.expires_at && key.expires_at <= new Date())) return null;
  const partner = await ApiPartner.findById(key.partner_id).lean();
  if (!partner || partner.status !== "active") return null;
  return { partner, apiKey: key };
}

export async function markApiKeyUsed(apiKeyId) {
  await ApiKey.updateOne({ _id: apiKeyId }, { $set: { last_used_at: new Date() } });
}

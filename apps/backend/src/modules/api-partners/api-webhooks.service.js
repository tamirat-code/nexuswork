import crypto from "node:crypto";
import ApiPartner from "./api-partners.model.js";
import ApiWebhookSubscription, { PARTNER_WEBHOOK_EVENTS } from "./api-webhook-subscription.model.js";
import ApiWebhookDelivery from "./api-webhook-delivery.model.js";
import { decryptWebhookSecret, encryptWebhookSecret } from "./webhook-secrets.js";
import { ValidationError, NotFoundError } from "../../shared/exceptions/AppError.js";
import { env } from "../../config/env.js";

const MAX_ATTEMPTS = 8;
const DELIVERY_TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 21_600_000, 43_200_000, 86_400_000];

function validateWebhookUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new ValidationError("Webhook URL must be a valid URL"); }
  if (!env.isTest && env.nodeEnv !== "development" && parsed.protocol !== "https:") {
    throw new ValidationError("Production webhook URLs must use HTTPS");
  }
  return parsed.toString().replace(/\/$/, "");
}

function normalizeEvents(events) {
  const selected = [...new Set(events || [])];
  if (!selected.length) throw new ValidationError("Select at least one webhook event");
  if (selected.some((event) => !PARTNER_WEBHOOK_EVENTS.includes(event))) {
    throw new ValidationError("One or more webhook events are unsupported");
  }
  return selected;
}

function newSecret() {
  return `whsec_${crypto.randomBytes(32).toString("base64url")}`;
}

function sanitize(subscription) {
  return {
    _id: subscription._id,
    partner_id: subscription.partner_id,
    url: subscription.url,
    events: subscription.events,
    secret_prefix: subscription.secret_prefix,
    status: subscription.status,
    last_delivery_at: subscription.last_delivery_at,
    failure_count: subscription.failure_count,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

export async function listWebhookSubscriptions(partnerId) {
  const subscriptions = await ApiWebhookSubscription.find({ partner_id: partnerId }).sort({ createdAt: -1 }).lean();
  return subscriptions.map(sanitize);
}

export async function createWebhookSubscription({ partnerId, url, events }) {
  const partner = await ApiPartner.findById(partnerId).select("status").lean();
  if (!partner) throw new NotFoundError("API partner not found");
  if (partner.status !== "active") throw new ValidationError("Webhooks cannot be created for an inactive API partner");
  const secret = newSecret();
  const subscription = await ApiWebhookSubscription.create({
    partner_id: partnerId,
    url: validateWebhookUrl(url),
    events: normalizeEvents(events),
    secret_encrypted: encryptWebhookSecret(secret),
    secret_prefix: `${secret.slice(0, 12)}…`,
  });
  return { subscription: sanitize(subscription.toObject()), webhook_secret: secret };
}

export async function updateWebhookSubscription({ partnerId, subscriptionId, url, events, status }) {
  const subscription = await ApiWebhookSubscription.findOne({ _id: subscriptionId, partner_id: partnerId });
  if (!subscription) throw new NotFoundError("Webhook subscription not found");
  if (url !== undefined) subscription.url = validateWebhookUrl(url);
  if (events !== undefined) subscription.events = normalizeEvents(events);
  if (status !== undefined) subscription.status = status;
  await subscription.save();
  return sanitize(subscription.toObject());
}

export async function rotateWebhookSecret({ partnerId, subscriptionId }) {
  const subscription = await ApiWebhookSubscription.findOne({ _id: subscriptionId, partner_id: partnerId });
  if (!subscription) throw new NotFoundError("Webhook subscription not found");
  const secret = newSecret();
  subscription.secret_encrypted = encryptWebhookSecret(secret);
  subscription.secret_prefix = `${secret.slice(0, 12)}…`;
  await subscription.save();
  return { subscription: sanitize(subscription.toObject()), webhook_secret: secret };
}

export async function disableWebhookSubscription({ partnerId, subscriptionId }) {
  return updateWebhookSubscription({ partnerId, subscriptionId, status: "disabled" });
}

export async function publishPartnerEvent(eventType, data) {
  if (!PARTNER_WEBHOOK_EVENTS.includes(eventType)) return { queued: 0 };
  const subscriptions = await ApiWebhookSubscription.find({ events: eventType, status: "active" }).select("_id partner_id").lean();
  if (!subscriptions.length) return { queued: 0 };
  const event = {
    id: `evt_${crypto.randomBytes(18).toString("base64url")}`,
    type: eventType,
    created_at: new Date().toISOString(),
    data,
  };
  let queued = 0;
  for (const subscription of subscriptions) {
    try {
      await ApiWebhookDelivery.create({
        subscription_id: subscription._id,
        partner_id: subscription.partner_id,
        event_id: event.id,
        event_type: eventType,
        payload: event,
      });
      queued += 1;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  void dispatchDueWebhookDeliveries({ limit: Math.min(queued, 10) }).catch(() => {});
  return { queued };
}

function claimFilter(now) {
  return {
    $or: [
      { status: { $in: ["pending", "failed"] }, next_attempt_at: { $lte: now } },
      { status: "delivering", lease_until: { $lte: now } },
    ],
  };
}

async function claimDelivery(now) {
  return ApiWebhookDelivery.findOneAndUpdate(
    claimFilter(now),
    { $set: { status: "delivering", lease_until: new Date(now.getTime() + DELIVERY_TIMEOUT_MS) }, $inc: { attempt_count: 1 } },
    { sort: { next_attempt_at: 1 }, new: true }
  ).lean();
}

async function deliver(delivery) {
  const subscription = await ApiWebhookSubscription.findOne({ _id: delivery.subscription_id, status: "active" }).select("+secret_encrypted url").lean();
  if (!subscription) {
    await ApiWebhookDelivery.updateOne({ _id: delivery._id }, { $set: { status: "exhausted", last_error: "Webhook subscription is disabled or missing", lease_until: null } });
    return;
  }
  const body = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", decryptWebhookSecret(subscription.secret_encrypted)).update(`${timestamp}.${body}`).digest("hex");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const response = await fetch(subscription.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NexusWork-Webhooks/1.0",
        "X-NexusWork-Webhook-Id": delivery.event_id,
        "X-NexusWork-Webhook-Timestamp": String(timestamp),
        "X-NexusWork-Webhook-Signature": `v1=${signature}`,
        "Idempotency-Key": delivery.event_id,
      },
      body,
      signal: controller.signal,
    });
    const responseBody = (await response.text()).slice(0, 2000);
    if (!response.ok) throw new Error(`Webhook endpoint returned HTTP ${response.status}`);
    await ApiWebhookDelivery.updateOne({ _id: delivery._id }, { $set: { status: "delivered", response_status: response.status, response_body: responseBody, delivered_at: new Date(), lease_until: null }, $unset: { last_error: 1 } });
    await ApiWebhookSubscription.updateOne({ _id: subscription._id }, { $set: { last_delivery_at: new Date(), failure_count: 0 } });
  } catch (error) {
    const finalAttempt = delivery.attempt_count >= MAX_ATTEMPTS;
    const retryDelay = RETRY_DELAYS_MS[Math.min(delivery.attempt_count - 1, RETRY_DELAYS_MS.length - 1)] || RETRY_DELAYS_MS.at(-1);
    await ApiWebhookDelivery.updateOne(
      { _id: delivery._id },
      { $set: { status: finalAttempt ? "exhausted" : "failed", last_error: error.name === "AbortError" ? "Webhook delivery timed out" : error.message, next_attempt_at: new Date(Date.now() + retryDelay), lease_until: null } }
    );
    await ApiWebhookSubscription.updateOne({ _id: subscription._id }, { $inc: { failure_count: 1 } });
  } finally {
    clearTimeout(timeout);
  }
}

export async function dispatchDueWebhookDeliveries({ limit = 50 } = {}) {
  let delivered = 0;
  for (let index = 0; index < limit; index += 1) {
    const delivery = await claimDelivery(new Date());
    if (!delivery) break;
    await deliver(delivery);
    delivered += 1;
  }
  return { processed: delivered };
}

export async function listWebhookDeliveries(partnerId, limit = 50) {
  return ApiWebhookDelivery.find({ partner_id: partnerId }).sort({ createdAt: -1 }).limit(Math.min(100, Math.max(1, limit))).select("event_id event_type status attempt_count next_attempt_at response_status last_error delivered_at createdAt subscription_id").lean();
}

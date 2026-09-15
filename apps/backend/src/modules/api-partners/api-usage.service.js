import ApiUsage from "./api-usage.model.js";
import ApiRateLimitBucket from "./api-rate-limit.model.js";
import { tierLimits } from "./api-partners.service.js";

export function monthWindow(value = new Date()) {
  const date = new Date(value);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export function minuteWindow(value = new Date()) {
  const date = new Date(value);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes()));
  const end = new Date(start.getTime() + 60_000);
  return { start, end };
}

async function incrementWithLimit(Model, filter, limit, defaults, increment = { request_count: 1 }) {
  try {
    return await Model.findOneAndUpdate(
      { ...filter, request_count: { $lt: limit } },
      { $inc: increment, $set: { last_request_at: new Date() }, $setOnInsert: defaults },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  } catch (error) {
    // Two first requests can race while creating a unique period/window row.
    // Retrying the same conditional update makes the counter remain atomic.
    if (error?.code !== 11000) throw error;
    return Model.findOneAndUpdate(
      { ...filter, request_count: { $lt: limit } },
      { $inc: increment, $set: { last_request_at: new Date() } },
      { new: true }
    ).lean();
  }
}

export async function consumePartnerRequest(partner, now = new Date()) {
  const limits = tierLimits(partner.tier);
  const minute = minuteWindow(now);
  const rate = await incrementWithLimit(
    ApiRateLimitBucket,
    { partner_id: partner._id, window_start: minute.start },
    limits.requestsPerMinute,
    { partner_id: partner._id, window_start: minute.start }
  );

  if (!rate) {
    return {
      allowed: false,
      code: "PARTNER_RATE_LIMITED",
      retryAfterSeconds: Math.max(1, Math.ceil((minute.end.getTime() - now.getTime()) / 1000)),
      rate: { limit: limits.requestsPerMinute, remaining: 0, resetAt: minute.end },
    };
  }

  const month = monthWindow(now);
  const usage = await incrementWithLimit(
    ApiUsage,
    { partner_id: partner._id, period_start: month.start },
    limits.monthlyQuota,
    { partner_id: partner._id, period_start: month.start, period_end: month.end },
    { request_count: 1 }
  );

  if (!usage) {
    return {
      allowed: false,
      code: "PARTNER_MONTHLY_QUOTA_EXCEEDED",
      retryAfterSeconds: Math.max(1, Math.ceil((month.end.getTime() - now.getTime()) / 1000)),
      usage: { requestCount: limits.monthlyQuota, quota: limits.monthlyQuota, remaining: 0, periodStart: month.start, periodEnd: month.end },
      rate: { limit: limits.requestsPerMinute, remaining: Math.max(0, limits.requestsPerMinute - rate.request_count), resetAt: minute.end },
    };
  }

  return {
    allowed: true,
    usage: {
      requestCount: usage.request_count,
      quota: limits.monthlyQuota,
      remaining: Math.max(0, limits.monthlyQuota - usage.request_count),
      periodStart: month.start,
      periodEnd: month.end,
    },
    rate: {
      limit: limits.requestsPerMinute,
      remaining: Math.max(0, limits.requestsPerMinute - rate.request_count),
      resetAt: minute.end,
    },
  };
}

export async function getCurrentPartnerUsage(partner, now = new Date()) {
  const month = monthWindow(now);
  const limits = tierLimits(partner.tier);
  const usage = await ApiUsage.findOne({ partner_id: partner._id, period_start: month.start }).lean();
  const requestCount = usage?.request_count || 0;
  return {
    requestCount,
    quota: limits.monthlyQuota,
    remaining: Math.max(0, limits.monthlyQuota - requestCount),
    periodStart: month.start,
    periodEnd: month.end,
  };
}

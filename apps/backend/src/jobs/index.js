// Scheduled/background jobs (meeting reminders and lifecycle reconciliation).
import crypto from "node:crypto";
import Meeting from "../modules/meetings/meetings.model.js";
import { createNotification } from "../modules/notifications/notifications.service.js";
import { expireMeetings } from "../modules/meetings/meetings.service.js";
import { expireProjects } from "../modules/projects/projects.service.js";
import { reconcilePendingReleases, reconcilePendingRefunds } from "../modules/payments/payments.service.js";
import JobLock from "./job-lock.model.js";
import { dispatchDueWebhookDeliveries } from "../modules/api-partners/api-webhooks.service.js";
import { evaluateAtRiskMilestones } from "../modules/oversight/index.js";
import { chargeDueStripePartnerStatements } from "../modules/api-partners/api-billing-payments.service.js";

const JOB_LOCK_TTL_MS = 4 * 60 * 1000;

async function withJobLock(name, work) {
  const owner = crypto.randomUUID();
  const now = new Date();
  let lock;
  try {
    lock = await JobLock.findOneAndUpdate(
      { _id: name, $or: [{ expires_at: { $lte: now } }, { owner }] },
      { $set: { owner, expires_at: new Date(now.getTime() + JOB_LOCK_TTL_MS) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
  if (!lock || lock.owner !== owner) return false;
  try {
    await work();
  } finally {
    await JobLock.deleteOne({ _id: name, owner }).catch(() => {});
  }
  return true;
}

export function registerJobs() {
  const timer = setInterval(async () => {
    await withJobLock("meeting-reminders", async () => {
      try {
        const now = new Date();
        await expireMeetings();
        await expireProjects();
        const soon = new Date(now.getTime() + 15 * 60 * 1000);
        const meetings = await Meeting.find({ status: "scheduled", scheduled_start: { $gt: now, $lte: soon }, reminder_sent_at: null }).limit(100);
        for (const meeting of meetings) {
          const claimed = await Meeting.findOneAndUpdate({ _id: meeting._id, reminder_sent_at: null }, { reminder_sent_at: now }, { new: true });
          if (!claimed) continue;
          await Promise.all(meeting.participants.map((p) => createNotification({ userId: p.user_id, type: "meeting_starting_soon", title: "Meeting starting soon", body: meeting.title, data: { meeting_id: meeting._id, action: "view_meeting" } })));
        }
      } catch (error) {
        console.error("[jobs] meeting reminder failed:", error.message);
      }
    });
  }, 60 * 1000);
  timer.unref?.();

  const reconciliationTimer = setInterval(async () => {
    await withJobLock("payout-reconciliation", async () => {
      try {
        const result = await reconcilePendingReleases({ limit: 100 });
        if (result.checked) console.log(`[jobs] payout reconciliation checked=${result.checked} succeeded=${result.succeeded} failed=${result.failed}`);
      } catch (error) {
        console.error("[jobs] payout reconciliation failed:", error.message);
      }
    });
  }, 5 * 60 * 1000);
  reconciliationTimer.unref?.();

  const refundReconciliationTimer = setInterval(async () => {
    await withJobLock("refund-reconciliation", async () => {
      try {
        const result = await reconcilePendingRefunds({ limit: 100 });
        if (result.checked) console.log(`[jobs] refund reconciliation checked=${result.checked} succeeded=${result.succeeded} failed=${result.failed}`);
      } catch (error) {
        console.error("[jobs] refund reconciliation failed:", error.message);
      }
    });
  }, 5 * 60 * 1000);
  refundReconciliationTimer.unref?.();

  const webhookDeliveryTimer = setInterval(async () => {
    await withJobLock("partner-webhook-delivery", async () => {
      try {
        await dispatchDueWebhookDeliveries({ limit: 100 });
      } catch (error) {
        console.error("[jobs] partner webhook delivery failed:", error.message);
      }
    });
  }, 5 * 1000);
  webhookDeliveryTimer.unref?.();

  const oversightTimer = setInterval(async () => {
    await withJobLock("oversight-at-risk-evaluation", async () => {
      try {
        const result = await evaluateAtRiskMilestones({ limit: 100 });
        if (result.failed) console.error(`[jobs] at-risk evaluation completed with failures=${result.failed} evaluated=${result.evaluated}`);
      } catch (error) {
        console.error("[jobs] at-risk evaluation failed:", error.message);
      }
    });
  }, 5 * 60 * 1000);
  oversightTimer.unref?.();

  const apiBillingTimer = setInterval(async () => {
    await withJobLock("api-stripe-usage-billing", async () => {
      try {
        const result = await chargeDueStripePartnerStatements({ limit: 100 });
        if (result.checked) console.log("[jobs] API billing checked=" + result.checked + " charged=" + result.charged + " failed=" + result.failed);
      } catch (error) {
        console.error("[jobs] API billing failed:", error.message);
      }
    });
  }, 60 * 60 * 1000);
  apiBillingTimer.unref?.();

  return () => {
    clearInterval(timer);
    clearInterval(reconciliationTimer);
    clearInterval(refundReconciliationTimer);
    clearInterval(webhookDeliveryTimer);
    clearInterval(oversightTimer);
    clearInterval(apiBillingTimer);
  };
}

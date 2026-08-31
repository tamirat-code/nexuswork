// Scheduled/background jobs (meeting reminders and lifecycle reconciliation).
import crypto from "node:crypto";
import Meeting from "../modules/meetings/meetings.model.js";
import { createNotification } from "../modules/notifications/notifications.service.js";
import { expireMeetings } from "../modules/meetings/meetings.service.js";
import { reconcilePendingReleases, reconcilePendingRefunds } from "../modules/payments/payments.service.js";
import JobLock from "./job-lock.model.js";

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

  return () => {
    clearInterval(timer);
    clearInterval(reconciliationTimer);
    clearInterval(refundReconciliationTimer);
  };
}

// Scheduled/background jobs (meeting reminders and future lifecycle tasks).
import Meeting from "../modules/meetings/meetings.model.js";
import { createNotification } from "../modules/notifications/notifications.service.js";
import { expireMeetings } from "../modules/meetings/meetings.service.js";
import { reconcilePendingReleases } from "../modules/payments/payments.service.js";

export function registerJobs() {
  let reconciliationInProgress = false;
  const timer = setInterval(async () => {
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
  }, 60 * 1000);
  timer.unref?.();

  // Provider calls can take longer than one scheduler interval. The guard
  // prevents two payout reconciliation passes from processing the same
  // pending release concurrently.
  const reconciliationTimer = setInterval(async () => {
    if (reconciliationInProgress) return;
    reconciliationInProgress = true;
    try {
      const result = await reconcilePendingReleases({ limit: 100 });
      if (result.checked) {
        console.log(`[jobs] payout reconciliation checked=${result.checked} succeeded=${result.succeeded} failed=${result.failed}`);
      }
    } catch (error) {
      console.error("[jobs] payout reconciliation failed:", error.message);
    } finally {
      reconciliationInProgress = false;
    }
  }, 5 * 60 * 1000);
  reconciliationTimer.unref?.();

  return () => {
    clearInterval(timer);
    clearInterval(reconciliationTimer);
  };
}

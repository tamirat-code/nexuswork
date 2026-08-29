// Scheduled/background jobs (meeting reminders and future lifecycle tasks).
import Meeting from "../modules/meetings/meetings.model.js";
import { createNotification } from "../modules/notifications/notifications.service.js";
import { expireMeetings } from "../modules/meetings/meetings.service.js";

export function registerJobs() {
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
  return () => clearInterval(timer);
}

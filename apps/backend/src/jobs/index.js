// Scheduled/background jobs (e.g. deadline reminders, escrow auto-release
// after a review window). Wire a scheduler (node-cron, bullmq) here once
// a real job needs to run — kept empty so importing this file has no side effects yet.
export function registerJobs() {
  // e.g. cron.schedule("0 * * * *", checkOverdueMilestones);
}

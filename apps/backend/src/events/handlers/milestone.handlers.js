import { eventBus } from "../index.js";
import { logger } from "../../shared/logger/logger.js";
import { createNotification } from "../../modules/notifications/notifications.service.js";
import { sendNotificationEmail } from "../../shared/mailer/mailer.service.js";
import User from "../../modules/users/users.model.js";

async function getEmail(userId) {
  const user = await User.findById(userId).select("email").lean();
  return user?.email;
}

eventBus.on("milestone.approved", async ({ milestoneId, studentId, payout }) => {
  logger.info(`[event] milestone.approved: ${milestoneId} -> student ${studentId} paid ${payout}`);
  try {
    await createNotification({
      userId: studentId,
      type: "milestone_approved",
      title: "Milestone approved & payment released",
      body: `Your milestone was approved and $${payout} has been released to your wallet.`,
      data: { milestone_id: milestoneId, payout },
    });
  } catch (err) {
    logger.error("[event] failed to create milestone.approved notification:", err.message);
  }

  
  try {
    const email = await getEmail(studentId);
    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: "Milestone approved & payment released",
        body: `Your milestone was approved and $${payout} has been released to your wallet.`,
      });
    }
  } catch (err) {
    logger.error("[event] failed to send milestone.approved email:", err.message);
  }
});

eventBus.on("milestone.funded", async ({ milestoneId, studentId, amount }) => {
  logger.info(`[event] milestone.funded: ${milestoneId} -> student ${studentId}`);
  try {
    await createNotification({
      userId: studentId,
      type: "milestone_funded",
      title: "Milestone funded — you can start work",
      body: `The client funded this milestone ($${amount}). It's held in escrow until you deliver and the client approves it.`,
      data: { milestone_id: milestoneId, amount },
    });
  } catch (err) {
    logger.error("[event] failed to create milestone.funded notification:", err.message);
  }

  try {
    const email = await getEmail(studentId);
    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: "Milestone funded — you can start work",
        body: `The client funded this milestone ($${amount}). It's held in escrow until you deliver and the client approves it.`,
      });
    }
  } catch (err) {
    logger.error("[event] failed to send milestone.funded email:", err.message);
  }
});

eventBus.on("milestone.delivered", async ({ milestoneId, clientId }) => {
  logger.info(`[event] milestone.delivered: ${milestoneId} -> client ${clientId}`);
  try {
    await createNotification({
      userId: clientId,
      type: "milestone_delivered",
      title: "Milestone delivered for review",
      body: "A student has submitted work for a milestone. Please review it.",
      data: { milestone_id: milestoneId },
    });
  } catch (err) {
    logger.error("[event] failed to create milestone.delivered notification:", err.message);
  }

  // Email fan-out (Section 3.10) — best-effort, never blocks the flow.
  try {
    const email = await getEmail(clientId);
    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: "Milestone delivered for review",
        body: "A student has submitted work for a milestone. Please review it.",
      });
    }
  } catch (err) {
    logger.error("[event] failed to send milestone.delivered email:", err.message);
  }
});

eventBus.on("milestone.revision_requested", async ({ milestoneId, studentId, version, reason, revisionCount, maxRevisions }) => {
  logger.info(`[event] milestone.revision_requested: ${milestoneId} -> student ${studentId}`);
  try {
    await createNotification({
      userId: studentId,
      type: "milestone_revision_requested",
      title: "Revision requested",
      body: `The client requested changes to submission v${version}. ${revisionCount} of ${maxRevisions} revisions used.`,
      data: { milestone_id: milestoneId, submission_version: version, reason, revision_count: revisionCount, max_revisions: maxRevisions },
    });
  } catch (err) {
    logger.error("[event] failed to create milestone.revision_requested notification:", err.message);
  }

  try {
    const email = await getEmail(studentId);
    if (email) {
      await sendNotificationEmail({
        to: email,
        subject: "Revision requested on your milestone",
        body: `The client requested changes to submission v${version}. ${reason}`,
      });
    }
  } catch (err) {
    logger.error("[event] failed to send milestone.revision_requested email:", err.message);
  }
});
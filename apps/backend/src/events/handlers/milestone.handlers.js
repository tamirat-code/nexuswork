import { eventBus } from "../index.js";
import { logger } from "../../shared/logger/logger.js";

// TODO: wire real notification creation once the notifications module has
// a create() function. For now this just logs so the event flow is visible.
eventBus.on("milestone.approved", ({ milestoneId, studentId, payout }) => {
  logger.info(`[event] milestone.approved: ${milestoneId} -> student ${studentId} paid ${payout}`);
});

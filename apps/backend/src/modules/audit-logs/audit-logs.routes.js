import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { list, getHistory, flag, getSummary } from "./audit-logs.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// List audit logs with filtering
router.get("/", list);

// Get history for a specific entity
router.get("/history/:entity_type/:entity_id", getHistory);

// Get audit summary/statistics
router.get("/summary", getSummary);

// Flag an audit entry for review
router.patch("/:id/flag", flag);

export default router;

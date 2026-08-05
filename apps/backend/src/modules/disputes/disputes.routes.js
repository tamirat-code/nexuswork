import { Router } from "express";
import { create, resolve, getOpen } from "./disputes.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

router.post("/milestone/:milestoneId", requireAuth, create);
router.get("/", requireAuth, requireRole("admin"), getOpen);
router.post("/:id/resolve", requireAuth, requireRole("admin"), resolve);

export default router;

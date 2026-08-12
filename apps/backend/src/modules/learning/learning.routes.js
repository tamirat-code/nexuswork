import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { getResources, getResource, postResource, patchResource, removeResource } from "./learning.controller.js";

const router = Router();

router.get("/", getResources);
router.get("/:id", getResource);
router.post("/", requireAuth, requireRole("admin"), postResource);
router.patch("/:id", requireAuth, requireRole("admin"), patchResource);
router.delete("/:id", requireAuth, requireRole("admin"), removeResource);

export default router;
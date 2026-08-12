import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { requestVerification, getMine, getAll, review } from "./verifications.controller.js";

const router = Router();

router.post("/", requireAuth, requestVerification);
router.get("/mine", requireAuth, getMine);
router.get("/", requireAuth, requireRole(ROLES.ADMIN), getAll);
router.patch("/:id/review", requireAuth, review);

export default router;
import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
  listClients,
  requestVerification,
  getVerifications,
  reviewVerification,
  postAdditionalPoster,
  deleteAdditionalPoster,
} from "./clients.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { updateClientProfileSchema, addPosterSchema, reviewClientVerificationSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", listClients);

router.get("/me", requireAuth, requireRole("client"), getMyProfile);
router.patch("/me", requireAuth, requireRole("client"), validateBody(updateClientProfileSchema), updateMyProfile);

router.post("/me/verification", requireAuth, requireRole("client"), requestVerification);
router.get("/verifications", requireAuth, requireRole(ROLES.ADMIN), getVerifications);
router.patch(
  "/verifications/:userId/review",
  requireAuth,
  requireRole(ROLES.ADMIN),
  validateBody(reviewClientVerificationSchema),
  reviewVerification
);

router.post("/me/posters", requireAuth, requireRole("client"), validateBody(addPosterSchema), postAdditionalPoster);
router.delete("/me/posters/:userId", requireAuth, requireRole("client"), deleteAdditionalPoster);

export default router;
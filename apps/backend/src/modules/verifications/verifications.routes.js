import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { ROLES } from "../../shared/enums/roles.enum.js";
import {
  requestVerification,
  getMine,
  exportCredential,
  exportCredentialCard,
  verifyPublicCredential,
  verifyCredential,
  getAll,
  stats,
  review,
  requestSkillCertification,
  getMySkillRequests,
  getSkillRequestQueue,
  reviewSkillRequest,
} from "./verifications.controller.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema, submitVerificationSchema, reviewVerificationSchema, submitSkillCertificationRequestSchema, reviewSkillCertificationRequestSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/credentials/verify", verifyCredential);
router.get("/credentials/:id/verify", validateParams(objectIdParamsSchema("id")), verifyPublicCredential);
router.post("/", requireAuth, validateBody(submitVerificationSchema), requestVerification);
router.get("/mine", requireAuth, getMine);
router.get("/mine/:id/credential/card", requireAuth, exportCredentialCard);
router.get("/mine/:id/credential", requireAuth, exportCredential);
router.post("/skill-requests", requireAuth, requireRole(ROLES.STUDENT), validateBody(submitSkillCertificationRequestSchema), requestSkillCertification);
router.get("/skill-requests/mine", requireAuth, requireRole(ROLES.STUDENT), getMySkillRequests);
router.get("/skill-requests/queue", requireAuth, requireRole(ROLES.UNIVERSITY_STAFF, ROLES.ADMIN), getSkillRequestQueue);
router.patch("/skill-requests/:id/review", requireAuth, requireRole(ROLES.UNIVERSITY_STAFF, ROLES.ADMIN), validateBody(reviewSkillCertificationRequestSchema), reviewSkillRequest);
router.get("/stats", requireAuth, requireRole(ROLES.ADMIN, ROLES.UNIVERSITY_STAFF), stats);
router.get("/", requireAuth, requireRole(ROLES.ADMIN, ROLES.UNIVERSITY_STAFF), getAll);
router.patch("/:id/review", requireAuth, validateBody(reviewVerificationSchema), review);

export default router;

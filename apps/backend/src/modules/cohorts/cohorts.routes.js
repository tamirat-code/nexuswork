import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { cohortIdParamsSchema, cohortApplicationParamsSchema, createCohortSchema } from "./cohorts.validators.js";
import { create, list, getOne, apply, applications, accept, progress } from "./cohorts.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", list);
router.post("/", requireEmailVerified, validateBody(createCohortSchema), create);
router.get("/:cohortId", validateParams(cohortIdParamsSchema), getOne);
router.post("/:cohortId/applications", requireEmailVerified, validateParams(cohortIdParamsSchema), apply);
router.get("/:cohortId/applications", validateParams(cohortIdParamsSchema), applications);
router.get("/:cohortId/progress", validateParams(cohortIdParamsSchema), progress);
router.post("/:cohortId/applications/:applicationId/accept", requireEmailVerified, validateParams(cohortApplicationParamsSchema), accept);
export default router;

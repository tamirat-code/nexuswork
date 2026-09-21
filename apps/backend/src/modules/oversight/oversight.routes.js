import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireEmailVerified } from "../../middleware/verification.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema, createOversightTaskSchema, updateOversightTaskSchema, createCheckInSchema } from "../../shared/validators/schemas.js";
import { getOversight, createTask, updateTask, createCheckIn, listCheckIns, getContractsOverview } from "./oversight.controller.js";

const router = Router();
router.get("/contracts", requireAuth, getContractsOverview);
router.get("/projects/:projectId", requireAuth, validateParams(objectIdParamsSchema("projectId")), getOversight);
router.post("/projects/:projectId/tasks", requireAuth, requireEmailVerified, validateParams(objectIdParamsSchema("projectId")), validateBody(createOversightTaskSchema), createTask);
router.patch("/tasks/:taskId", requireAuth, requireEmailVerified, validateParams(objectIdParamsSchema("taskId")), validateBody(updateOversightTaskSchema), updateTask);
router.get("/projects/:projectId/check-ins", requireAuth, validateParams(objectIdParamsSchema("projectId")), listCheckIns);
router.post("/projects/:projectId/check-ins", requireAuth, requireEmailVerified, validateParams(objectIdParamsSchema("projectId")), validateBody(createCheckInSchema), createCheckIn);

export default router;

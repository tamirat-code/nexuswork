import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema, userReportSchema } from "../../shared/validators/schemas.js";
import { block, report, unblock } from "./safety.controller.js";

const router = Router();
const params = validateParams(objectIdParamsSchema("userId"));
router.put("/blocks/:userId", requireAuth, params, block);
router.delete("/blocks/:userId", requireAuth, params, unblock);
router.post("/reports/:userId", requireAuth, params, validateBody(userReportSchema), report);
export default router;

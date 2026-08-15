import { Router } from "express";
import { create, getForContract } from "./messaging.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { sendMessageSchema } from "../../shared/validators/schemas.js";
import { validatePagination } from "../../shared/validators/pagination.middleware.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, validateBody(sendMessageSchema), create);
router.get("/contract/:contractId", requireAuth, validatePagination, getForContract);

export default router;

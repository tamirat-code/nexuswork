import { Router } from "express";
import { create, getForContract } from "./messaging.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { sendMessageSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, validateBody(sendMessageSchema), create);
router.get("/contract/:contractId", requireAuth, getForContract);

export default router;

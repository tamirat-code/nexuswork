import { Router } from "express";
import { create, getForContract, startPreContract, getPreContract, createPreContractMessage } from "./messaging.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { sendMessageSchema } from "../../shared/validators/schemas.js";
import { validatePagination } from "../../shared/validators/pagination.middleware.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, validateBody(sendMessageSchema), create);
router.get("/contract/:contractId", requireAuth, validatePagination, getForContract);
router.post("/pre-contract/project/:projectId/student/:studentId", requireAuth, requireRole("client", "admin"), startPreContract);
router.get("/pre-contract/:conversationId", requireAuth, validatePagination, getPreContract);
router.post("/pre-contract/:conversationId/messages", requireAuth, validateBody(sendMessageSchema), createPreContractMessage);

export default router;

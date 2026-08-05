import { Router } from "express";
import { create, getForContract } from "./messaging.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, create);
router.get("/contract/:contractId", requireAuth, getForContract);

export default router;

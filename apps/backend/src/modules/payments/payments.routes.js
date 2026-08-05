import { Router } from "express";
import { getMyPayments } from "./payments.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getMyPayments);

export default router;

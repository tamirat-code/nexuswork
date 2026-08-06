import { Router } from "express";
import { handleStripeWebhook } from "./webhooks.controller.js";

const router = Router();

router.post("/stripe", handleStripeWebhook);

export default router;
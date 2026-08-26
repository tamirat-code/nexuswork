import { Router } from "express";
import { handleStripeWebhook, handleChapaCallback, handleChapaWebhook } from "./webhooks.controller.js";

const router = Router();

router.post("/stripe", handleStripeWebhook);
router.get("/chapa/callback", handleChapaCallback);
router.post("/chapa", handleChapaWebhook);

export default router;

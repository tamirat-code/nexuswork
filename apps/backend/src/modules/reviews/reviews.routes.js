import { Router } from "express";
import { create, getForUser } from "./reviews.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, create);
router.get("/user/:userId", getForUser);

export default router;

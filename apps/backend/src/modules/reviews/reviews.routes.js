import { Router } from "express";
import { create, getForUser } from "./reviews.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createReviewSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/contract/:contractId", requireAuth, validateBody(createReviewSchema), create);
router.get("/user/:userId", getForUser);

export default router;

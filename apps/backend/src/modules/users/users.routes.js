import { Router } from "express";
import { getUser } from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/:id", requireAuth, getUser);

export default router;

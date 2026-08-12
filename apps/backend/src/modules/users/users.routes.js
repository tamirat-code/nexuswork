import { Router } from "express";
import { getUser, getMe, updateMe, updateMyAvatar, removeMyAvatar } from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validation.middleware.js";
import { validateUpdateMe } from "../../shared/validators/user.validators.js";

const router = Router();

// Current user endpoints
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validateBody(validateUpdateMe), updateMe);
router.patch("/me/avatar", requireAuth, updateMyAvatar);
router.delete("/me/avatar", requireAuth, removeMyAvatar);

// Public user profile by id
router.get("/:id", requireAuth, getUser);

export default router;

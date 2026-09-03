import { Router } from "express";
import { getUser, getMe, updateMe, updatePreferences, updateMyAvatar, removeMyAvatar, exportMyData, deactivateMyAccount } from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validation.middleware.js";
import { validateUpdateMe } from "../../shared/validators/user.validators.js";

const router = Router();

// Current user endpoints
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validateBody(validateUpdateMe), updateMe);
router.patch("/me/preferences", requireAuth, (req, res, next) => { if (!["en", "am", "af"].includes(req.body?.preferred_language)) return res.status(400).json({ success: false, code: "UNSUPPORTED_LOCALE", message: "Unsupported language" }); next(); }, updatePreferences);
router.patch("/me/avatar", requireAuth, updateMyAvatar);
router.delete("/me/avatar", requireAuth, removeMyAvatar);
router.get("/me/export", requireAuth, exportMyData);
router.post("/me/deactivate", requireAuth, deactivateMyAccount);

// Public user profile by id
router.get("/:id", requireAuth, getUser);

export default router;

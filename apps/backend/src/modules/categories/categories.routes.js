import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getCategories, getCategory, postCategory, patchCategory, removeCategory } from "./categories.controller.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createCategorySchema, updateCategorySchema } from "../../shared/validators/schemas.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", requireAuth, requireRole("admin"), validateBody(createCategorySchema), postCategory);
router.put("/:id", requireAuth, requireRole("admin"), validateBody(updateCategorySchema), patchCategory);
router.delete("/:id", requireAuth, requireRole("admin"), removeCategory);

export default router;
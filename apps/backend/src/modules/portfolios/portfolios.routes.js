import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postPortfolioItem, getMyPortfolio, getUserPortfolio, getPortfolioItem, patchPortfolioItem, removePortfolioItem } from "./portfolios.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createPortfolioItemSchema, updatePortfolioItemSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(createPortfolioItemSchema), postPortfolioItem);
router.get("/mine", requireAuth, getMyPortfolio);
router.get("/user/:userId", getUserPortfolio);
router.get("/:id", getPortfolioItem);
router.patch("/:id", requireAuth, validateBody(updatePortfolioItemSchema), patchPortfolioItem);
router.delete("/:id", requireAuth, removePortfolioItem);

export default router;
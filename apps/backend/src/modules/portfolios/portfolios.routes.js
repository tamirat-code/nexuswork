import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postPortfolioItem, getMyPortfolio, getUserPortfolio, getPortfolioItem, patchPortfolioItem, removePortfolioItem } from "./portfolios.controller.js";

const router = Router();

router.post("/", requireAuth, postPortfolioItem);
router.get("/mine", requireAuth, getMyPortfolio);
router.get("/user/:userId", getUserPortfolio);
router.get("/:id", getPortfolioItem);
router.patch("/:id", requireAuth, patchPortfolioItem);
router.delete("/:id", requireAuth, removePortfolioItem);

export default router;
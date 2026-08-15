import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  postPortfolioItem,
  postFromMilestone,
  patchMilestoneConsent,
  getMyPortfolio,
  getUserPortfolio,
  getPortfolioItem,
  patchPortfolioItem,
  removePortfolioItem,
} from "./portfolios.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createPortfolioItemSchema, updatePortfolioItemSchema, milestoneConsentSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(createPortfolioItemSchema), postPortfolioItem);

router.post("/from-milestone/:milestoneId", requireAuth, postFromMilestone);
router.patch("/:id/consent", requireAuth, validateBody(milestoneConsentSchema), patchMilestoneConsent);
router.get("/mine", requireAuth, getMyPortfolio);
router.get("/user/:userId", getUserPortfolio);
router.get("/:id", getPortfolioItem);
router.patch("/:id", requireAuth, validateBody(updatePortfolioItemSchema), patchPortfolioItem);
router.delete("/:id", requireAuth, removePortfolioItem);

export default router;
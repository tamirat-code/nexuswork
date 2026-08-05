import { Router } from "express";
import { placeholder } from "./portfolios.controller.js";

const router = Router();

// TODO: replace with real routes for the "portfolios" module.
router.get("/", placeholder);

export default router;

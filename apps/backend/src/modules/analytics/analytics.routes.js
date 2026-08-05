import { Router } from "express";
import { placeholder } from "./analytics.controller.js";

const router = Router();

// TODO: replace with real routes for the "analytics" module.
router.get("/", placeholder);

export default router;

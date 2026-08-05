import { Router } from "express";
import { placeholder } from "./learning.controller.js";

const router = Router();

// TODO: replace with real routes for the "learning" module.
router.get("/", placeholder);

export default router;

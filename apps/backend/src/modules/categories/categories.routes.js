import { Router } from "express";
import { placeholder } from "./categories.controller.js";

const router = Router();

// TODO: replace with real routes for the "categories" module.
router.get("/", placeholder);

export default router;

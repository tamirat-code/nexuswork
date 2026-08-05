import { Router } from "express";
import { placeholder } from "./search.controller.js";

const router = Router();

// TODO: replace with real routes for the "search" module.
router.get("/", placeholder);

export default router;

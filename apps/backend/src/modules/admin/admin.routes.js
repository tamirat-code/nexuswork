import { Router } from "express";
import { placeholder } from "./admin.controller.js";

const router = Router();

// TODO: replace with real routes for the "admin" module.
router.get("/", placeholder);

export default router;

import { Router } from "express";
import { placeholder } from "./notifications.controller.js";

const router = Router();

// TODO: replace with real routes for the "notifications" module.
router.get("/", placeholder);

export default router;

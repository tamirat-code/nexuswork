import { Router } from "express";
import { placeholder } from "./files.controller.js";

const router = Router();

// TODO: replace with real routes for the "files" module.
router.get("/", placeholder);

export default router;

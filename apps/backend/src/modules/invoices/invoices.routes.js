import { Router } from "express";
import { placeholder } from "./invoices.controller.js";

const router = Router();

// TODO: replace with real routes for the "invoices" module.
router.get("/", placeholder);

export default router;

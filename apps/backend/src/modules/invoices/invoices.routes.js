import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postInvoice, getInvoices, getInvoice, patchInvoiceStatus } from "./invoices.controller.js";

const router = Router();

router.post("/", requireAuth, postInvoice);
router.get("/", requireAuth, getInvoices);
router.get("/:id", requireAuth, getInvoice);
router.patch("/:id", requireAuth, patchInvoiceStatus);

export default router;
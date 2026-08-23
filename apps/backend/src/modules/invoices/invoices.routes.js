import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postInvoice, getInvoices, getInvoice, downloadInvoice, patchInvoiceStatus } from "./invoices.controller.js";
import { validateBody } from "../../shared/validators/ZodValidator.js";
import { createInvoiceSchema, updateInvoiceStatusSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(createInvoiceSchema), postInvoice);
router.get("/", requireAuth, getInvoices);
router.get("/:id/download", requireAuth, downloadInvoice);
router.get("/:id", requireAuth, getInvoice);
router.patch("/:id", requireAuth, validateBody(updateInvoiceStatusSchema), patchInvoiceStatus);

export default router;
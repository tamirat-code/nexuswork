import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { postInvoice, postOrganizationInvoice, postInvoicePaymentIntent, getInvoices, getInvoice, downloadInvoice, patchInvoiceStatus } from "./invoices.controller.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { createInvoiceSchema, createOrganizationInvoiceSchema, updateInvoiceStatusSchema, objectIdParamsSchema } from "../../shared/validators/schemas.js";

const router = Router();

router.post("/", requireAuth, validateBody(createInvoiceSchema), postInvoice);
router.post("/organizations/:organizationId/consolidated", requireAuth, validateParams(objectIdParamsSchema("organizationId")), validateBody(createOrganizationInvoiceSchema), postOrganizationInvoice);
router.post("/:id/payment-intent", requireAuth, validateParams(objectIdParamsSchema("id")), postInvoicePaymentIntent);
router.get("/", requireAuth, getInvoices);
router.get("/:id/download", requireAuth, downloadInvoice);
router.get("/:id", requireAuth, getInvoice);
router.patch("/:id", requireAuth, validateBody(updateInvoiceStatusSchema), patchInvoiceStatus);

export default router;

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { createInvoice, listInvoicesForUser, getInvoiceById, updateInvoiceStatus } from "./invoices.service.js";

export const postInvoice = asyncHandler(async (req, res) => {
  requireFields(req.body, ["contract_id", "amount", "line_items"]);
  const invoice = await createInvoice({
    contractId: req.body.contract_id,
    requestingUserId: req.user._id,
    amount: req.body.amount,
    currency: req.body.currency,
    dueDate: req.body.due_date,
    lineItems: req.body.line_items,
    milestoneId: req.body.milestone_id,
  });
  res.status(201).json({ success: true, data: invoice });
});

export const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await listInvoicesForUser(req.user._id, { status: req.query.status });
  res.json({ success: true, data: invoices });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceById(req.params.id, req.user._id);
  res.json({ success: true, data: invoice });
});

export const patchInvoiceStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ["status"]);
  const invoice = await updateInvoiceStatus(req.params.id, req.user._id, { status: req.body.status });
  res.json({ success: true, data: invoice });
});
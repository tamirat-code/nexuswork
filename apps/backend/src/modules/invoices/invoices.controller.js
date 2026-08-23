import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import { createInvoice, listInvoicesForUser, getInvoiceById, getInvoiceForDownload, updateInvoiceStatus } from "./invoices.service.js";
import { renderInvoicePdf } from "../../templates/invoice/invoice.pdf.js";
import { renderInvoiceCsv } from "../../templates/invoice/invoice.csv.js";

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

export const downloadInvoice = asyncHandler(async (req, res) => {
  const format = String(req.query.format || "pdf").toLowerCase();
  if (!["pdf", "csv"].includes(format)) {
    throw new ValidationError("format must be 'pdf' or 'csv'");
  }

  const invoice = await getInvoiceForDownload(req.params.id, req.user._id);
  const filename = `${invoice.invoice_number}.${format}`;

  if (format === "csv") {
    const csv = renderInvoiceCsv(invoice);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  }

  const pdfBuffer = await renderInvoicePdf(invoice);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(pdfBuffer);
});

export const patchInvoiceStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ["status"]);
  const invoice = await updateInvoiceStatus(req.params.id, req.user._id, { status: req.body.status });
  res.json({ success: true, data: invoice });
});
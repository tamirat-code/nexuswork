import Invoice from "./invoices.model.js";
import Contract from "../contracts/contracts.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import crypto from "node:crypto";
import { moneyFromLegacyMajorUnits } from "../../shared/money/money.js";

function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${yyyy}${mm}-${rand}`;
}

export async function createInvoice({ contractId, requestingUserId, amount, currency, dueDate, lineItems, milestoneId, auditContext = {} }) {
  if (!lineItems || !lineItems.length) {
    throw new ValidationError("At least one line item is required");
  }

  const contract = await Contract.findById(contractId);
  if (!contract) throw new NotFoundError("Contract not found");

  if (String(contract.client_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the contract's client can create an invoice");
  }

  const invoiceMoney = moneyFromLegacyMajorUnits(amount, currency || "usd", "invoice.amount");
  const canonicalLineItems = lineItems.map((item) => ({
    ...item,
    unit_price_minor: moneyFromLegacyMajorUnits(item.unit_price, invoiceMoney.currency, "invoice.line_items.unit_price").amountMinor,
  }));

  const invoice = await Invoice.create({
    contract_id: contractId,
    milestone_id: milestoneId,
    client_id: contract.client_id,
    student_id: contract.student_id,
    invoice_number: generateInvoiceNumber(),
    amount,
    amount_minor: invoiceMoney.amountMinor,
    currency: invoiceMoney.currency,
    due_date: dueDate,
    line_items: canonicalLineItems,
  });

  await recordEvent({
    actor: auditContext.actor,
    eventType: "INVOICE_CREATED",
    action: "invoice.created",
    entityType: "invoice",
    entityId: invoice._id,
    previousState: null,
    newState: invoice.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { contractId, milestoneId, amount: invoice.amount },
  });

  return invoice;
}

export async function listInvoicesForUser(userId, { status } = {}) {
  const query = { $or: [{ client_id: userId }, { student_id: userId }] };
  if (status && status !== "all") query.status = status;
  return Invoice.find(query).sort({ createdAt: -1 }).lean();
}

export async function getInvoiceById(id, userId) {
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isParty = [String(invoice.client_id), String(invoice.student_id)].includes(String(userId));
  if (!isParty) throw new ForbiddenError("Not a party to this invoice");

  return invoice;
}

export async function getInvoiceForDownload(id, userId) {
  const invoice = await Invoice.findById(id)
    .populate("contract_id", "terms.title")
    .populate("client_id", "name email")
    .populate("student_id", "name email")
    .lean();
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isParty = [String(invoice.client_id?._id || invoice.client_id), String(invoice.student_id?._id || invoice.student_id)].includes(
    String(userId)
  );
  if (!isParty) throw new ForbiddenError("Not a party to this invoice");

  return invoice;
}

export async function updateInvoiceStatus(id, userId, { status }, auditContext = {}) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new NotFoundError("Invoice not found");

  if (String(invoice.client_id) !== String(userId)) throw new ForbiddenError("Only the contract client can update invoice status");

  const allowedTransitions = {
    draft: ["sent", "cancelled"],
    sent: ["paid", "overdue", "cancelled"],
    overdue: ["paid", "cancelled"],
    paid: [],
    cancelled: [],
  };
  if (!allowedTransitions[invoice.status]?.includes(status)) {
    throw new ValidationError(`Cannot change invoice status from ${invoice.status} to ${status}`);
  }

  const previousState = invoice.status;
  invoice.status = status;
  if (status === "paid") invoice.paid_at = new Date();
  await invoice.save();
  await recordEvent({
    actor: auditContext.actor,
    eventType: "INVOICE_STATUS_UPDATED",
    action: "invoice.status_updated",
    entityType: "invoice",
    entityId: invoice._id,
    previousState,
    newState: invoice.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { updatedBy: userId },
  });
  return invoice;
}

import Invoice from "./invoices.model.js";
import Contract from "../contracts/contracts.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";

function generateInvoiceNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${yyyy}${mm}-${rand}`;
}

export async function createInvoice({ contractId, requestingUserId, amount, currency, dueDate, lineItems, milestoneId }) {
  if (!lineItems || !lineItems.length) {
    throw new ValidationError("At least one line item is required");
  }

  const contract = await Contract.findById(contractId);
  if (!contract) throw new NotFoundError("Contract not found");

  if (String(contract.client_id) !== String(requestingUserId)) {
    throw new ForbiddenError("Only the contract's client can create an invoice");
  }

  const invoice = await Invoice.create({
    contract_id: contractId,
    milestone_id: milestoneId,
    client_id: contract.client_id,
    student_id: contract.student_id,
    invoice_number: generateInvoiceNumber(),
    amount,
    currency: currency || "usd",
    due_date: dueDate,
    line_items: lineItems,
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

export async function updateInvoiceStatus(id, userId, { status }) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isParty = [String(invoice.client_id), String(invoice.student_id)].includes(String(userId));
  if (!isParty) throw new ForbiddenError("Not a party to this invoice");

  invoice.status = status;
  if (status === "paid") invoice.paid_at = new Date();
  await invoice.save();
  return invoice;
}
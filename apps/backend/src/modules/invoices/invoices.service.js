import Invoice from "./invoices.model.js";
import Contract from "../contracts/contracts.model.js";
import Organization from "../organizations/organizations.model.js";
import Milestone from "../milestones/milestones.model.js";
import Payment from "../payments/payments.model.js";
import FinancialJournal from "../financial-ledger/financial-journals.model.js";
import { legalConfig } from "../../config/legal.config.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import crypto from "node:crypto";
import { moneyFromLegacyMajorUnits } from "../../shared/money/money.js";
import { listOrganizationIdsForUser, getOrganizationMembershipForUser } from "../organizations/organization-access.service.js";

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
    invoice_type: "individual",
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
    reconciliation_status: "pending",
  });
  if (milestoneId) {
    const payment = await Payment.findOne({ milestone_id: milestoneId, direction: "deposit", status: "succeeded" }).lean();
    if (payment?.ledger_journal_id && (payment.provider_reference || payment.provider_payment_id)
      && await FinancialJournal.exists({ _id: payment.ledger_journal_id, source_type: "payment" })) {
      invoice.ledger_journal_ids = [String(payment.ledger_journal_id)];
      invoice.provider_reference = payment.provider_reference || payment.provider_payment_id;
      invoice.reconciliation_status = "reconciled";
      invoice.reconciled_at = new Date();
      await invoice.save();
    }
  }

  await recordEvent({
    actor: auditContext.actor,
    eventType: "INVOICE_CREATED",
    action: "invoice.created",
    entityType: "invoice",
    entityId: invoice._id,
    organizationId: invoice.organization_id,
    previousState: null,
    newState: invoice.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { contractId, milestoneId, amount: invoice.amount },
  });

  return invoice;
}

async function organizationMember(organizationId, userId) {
  const access = await getOrganizationMembershipForUser(organizationId, userId);
  return access && ["admin", "billing_viewer"].includes(access.role) ? access : null;
}

/**
 * Creates one organization invoice while retaining one immutable line per
 * contract milestone. Funding remains a separate provider-confirmed payment
 * for every milestone; consolidation is invoice presentation/collection only.
 */
export async function createOrganizationInvoice({ organizationId, milestoneIds, requestingUserId, dueDate, auditContext = {} }) {
  const organization = await Organization.findOne({ _id: organizationId, status: "active" });
  if (!organization) throw new NotFoundError("Organization not found");
  const membership = await organizationMember(organizationId, requestingUserId);
  if (!membership || !["admin", "billing_viewer"].includes(membership.role)) {
    throw new ForbiddenError("Only organization billing members can create invoices");
  }
  const mode = organization.billing_mode === "consolidated_invoice" ? "consolidated" : organization.billing_mode;
  if (!["consolidated", "net_30"].includes(mode)) {
    throw new ValidationError("Organization is not configured for consolidated billing");
  }
  if (mode === "net_30" && (!legalConfig.net30Enabled || !organization.net30_approved)) {
    throw new ValidationError("NET-30 requires legal approval and organization credit approval");
  }
  const ids = [...new Set((milestoneIds || []).map(String))];
  if (!ids.length) throw new ValidationError("At least one milestone is required");
  const milestones = await Milestone.find({ _id: { $in: ids } }).populate({
    path: "contract_id",
    select: "client_id student_id organization_id terms",
  }).lean();
  if (milestones.length !== ids.length) throw new NotFoundError("One or more milestones were not found");
  const lines = [];
  let currency;
  let totalMinor = 0;
  for (const milestone of milestones) {
    const contract = milestone.contract_id;
    if (!contract || String(contract.organization_id) !== String(organizationId)) {
      throw new ForbiddenError("Every milestone must belong to the selected organization");
    }
    if (!["not_funded", "funding_pending"].includes(milestone.status)) {
      throw new ValidationError("Only unfunded milestones can be added to a new consolidated invoice");
    }
    const lineCurrency = String(milestone.currency || "usd").toLowerCase();
    if (currency && currency !== lineCurrency) throw new ValidationError("Create separate invoices for each currency");
    currency = lineCurrency;
    const amountMinor = Number.isSafeInteger(milestone.amount_minor) ? milestone.amount_minor : Math.round(Number(milestone.amount) * 100);
    totalMinor += amountMinor;
    lines.push({
      description: `Milestone: ${milestone.title}`,
      quantity: 1,
      unit_price: amountMinor / 100,
      unit_price_minor: amountMinor,
      contract_id: contract._id,
      milestone_id: milestone._id,
    });
  }
  if (mode === "net_30" && organization.credit_limit_minor > 0 &&
      organization.credit_used_minor + totalMinor > organization.credit_limit_minor) {
    throw new ValidationError("Organization credit limit would be exceeded");
  }
  const key = `org:${organizationId}:${ids.sort().join(",")}`;
  const existing = await Invoice.findOne({ consolidation_key: key });
  if (existing) return existing;
  const invoice = await Invoice.create({
    invoice_type: "organization_consolidated",
    organization_id: organizationId,
    client_id: organization.owner_id,
    invoice_number: generateInvoiceNumber(),
    amount: totalMinor / 100,
    amount_minor: totalMinor,
    currency,
    billing_mode: mode,
    status: "sent",
    due_date: dueDate || (mode === "net_30" ? new Date(Date.now() + 30 * 86400000) : new Date()),
    line_items: lines,
    reconciliation_status: "pending",
    consolidation_key: key,
  });
  if (mode === "net_30") {
    await Organization.updateOne({ _id: organizationId }, { $inc: { credit_used_minor: totalMinor } });
  }
  await recordEvent({
    actor: auditContext.actor,
    eventType: "ORGANIZATION_INVOICE_CREATED",
    action: "organization.invoice_created",
    entityType: "invoice",
    entityId: invoice._id,
    organizationId,
    previousState: null,
    newState: invoice.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { organizationId, milestoneIds: ids, billingMode: mode },
  });
  return invoice;
}

export async function listInvoicesForUser(userId, { status } = {}) {
  const query = { $or: [{ client_id: userId }, { student_id: userId }] };
  if (status && status !== "all") query.status = status;
  const orgs = await listOrganizationIdsForUser(userId, ["admin", "billing_viewer"]);
  if (orgs.length) query.$or.push({ organization_id: { $in: orgs } });
  return Invoice.find(query)
    .populate("client_id", "name email")
    .populate("student_id", "name email")
    .populate("organization_id", "name")
    .populate("contract_id", "terms.title")
    .sort({ createdAt: -1 })
    .lean();
}

export async function getInvoiceById(id, userId) {
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isParty = [String(invoice.client_id), String(invoice.student_id)].includes(String(userId))
    || (invoice.organization_id && await organizationMember(invoice.organization_id, userId));
  if (!isParty) throw new ForbiddenError("Not a party to this invoice");

  return invoice;
}

export async function getInvoiceForDownload(id, userId) {
  const invoice = await Invoice.findById(id)
    .populate("contract_id", "terms.title")
    .populate("client_id", "name email")
    .populate("student_id", "name email")
    .populate("organization_id", "name")
    .lean();
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isParty = [String(invoice.client_id?._id || invoice.client_id), String(invoice.student_id?._id || invoice.student_id)].includes(String(userId))
    || (invoice.organization_id && await organizationMember(invoice.organization_id, userId));
  if (!isParty) throw new ForbiddenError("Not a party to this invoice");

  return invoice;
}

export async function updateInvoiceStatus(id, userId, { status }, auditContext = {}) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new NotFoundError("Invoice not found");

  const isOrgBillingMember = invoice.organization_id && await organizationMember(invoice.organization_id, userId);
  if (String(invoice.client_id) !== String(userId) && !isOrgBillingMember) throw new ForbiddenError("Only the invoice client or organization billing member can update invoice status");

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
  if (status === "paid" && invoice.reconciliation_status !== "reconciled") {
    throw new ValidationError("An invoice must reconcile against the financial ledger before payment");
  }
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

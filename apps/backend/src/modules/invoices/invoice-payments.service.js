import Invoice from "./invoices.model.js";
import InvoicePayment from "./invoice-payments.model.js";
import Milestone from "../milestones/milestones.model.js";
import Organization from "../organizations/organizations.model.js";
import OrgMembership from "../organizations/org-membership.model.js";
import { getPaymentProvider } from "../payments/providers/index.js";
import { postJournal } from "../financial-ledger/financial-ledger.service.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { money } from "../../shared/money/money.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";

async function assertBillingMember(invoiceId, userId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, invoice_type: "organization_consolidated" });
  if (!invoice) throw new NotFoundError("Organization invoice not found");
  const membership = await OrgMembership.findOne({ organization_id: invoice.organization_id, user_id: userId, status: "active" });
  if (!membership || !["admin", "billing_viewer"].includes(membership.role)) {
    throw new ForbiddenError("Only organization billing members can pay this invoice");
  }
  return invoice;
}

export async function createInvoicePayment({ invoiceId, requestingUserId, auditContext = {} }) {
  const invoice = await assertBillingMember(invoiceId, requestingUserId);
  if (!["sent", "overdue"].includes(invoice.status)) throw new ValidationError("This invoice is not payable");
  if (invoice.reconciliation_status === "reconciled") {
    throw new ValidationError("This invoice has already been funded and reconciled");
  }
  const pending = await InvoicePayment.findOne({ invoice_id: invoice._id, status: { $in: ["pending", "succeeded"] } });
  if (pending?.status === "succeeded") return pending;
  if (pending?.provider_payment_id) return pending;

  const operationKey = `invoice-payment-${invoice._id}`;
  const providerName = String(invoice.currency).toLowerCase() === "etb" ? "chapa" : "stripe";
  const provider = getPaymentProvider(providerName);
  const intent = await provider.createPaymentIntent({
    amountMinor: invoice.amount_minor,
    currency: invoice.currency,
    metadata: { invoice_id: String(invoice._id), organization_id: String(invoice.organization_id) },
    idempotencyKey: operationKey,
  });
  const payment = await InvoicePayment.findOneAndUpdate(
    { invoice_id: invoice._id, operation_key: operationKey },
    {
      $set: {
        amount_minor: invoice.amount_minor,
        currency: invoice.currency,
        provider: providerName,
        provider_payment_id: intent.id,
        provider_reference: intent.providerReference,
        provider_checkout_url: intent.clientSecret,
        status: "pending",
      },
      $setOnInsert: { invoice_id: invoice._id, operation_key: operationKey },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await recordEvent({
    actor: auditContext.actor,
    eventType: "ORGANIZATION_INVOICE_PAYMENT_STARTED",
    action: "organization.invoice_payment_started",
    entityType: "invoice",
    entityId: invoice._id,
    previousState: invoice.status,
    newState: invoice.status,
    correlationId: auditContext.correlationId,
    metadata: { provider: providerName, providerPaymentId: intent.id },
  });
  return payment;
}

export async function confirmInvoicePayment(providerPaymentId, auditContext = {}) {
  const payment = await InvoicePayment.findOne({
    $or: [{ provider_payment_id: providerPaymentId }, { provider_reference: providerPaymentId }],
  });
  if (!payment) return null;
  if (payment.status === "succeeded") return payment;
  const provider = getPaymentProvider(payment.provider);
  const intent = await provider.getPaymentIntent(payment.provider_payment_id || providerPaymentId);
  if (intent.status === "pending") return payment;
  if (intent.status !== "succeeded") {
    payment.status = "failed";
    payment.failure_message = `Provider payment is not succeeded (status: ${intent.providerStatus || intent.status})`;
    await payment.save();
    return payment;
  }
  if (String(intent.metadata?.invoice_id || "") !== String(payment.invoice_id)) {
    throw new ValidationError("Provider payment does not belong to this invoice");
  }
  if (intent.amountMinor !== payment.amount_minor || String(intent.currency).toLowerCase() !== String(payment.currency).toLowerCase()) {
    throw new ValidationError("Provider payment does not match the invoice");
  }
  const invoice = await Invoice.findById(payment.invoice_id).lean();
  if (!invoice) throw new NotFoundError("Invoice not found");
  const milestoneIds = (invoice.line_items || []).map((line) => line.milestone_id).filter(Boolean);
  const milestones = await Milestone.find({ _id: { $in: milestoneIds }, status: { $in: ["not_funded", "funding_pending"] } });
  if (milestones.length !== milestoneIds.length) throw new ValidationError("One or more invoice milestones are no longer payable");
  const journalIds = [];
  for (const milestone of milestones) {
    const amountMinor = Number.isSafeInteger(milestone.amount_minor) ? milestone.amount_minor : Math.round(milestone.amount * 100);
    const milestoneMoney = money(amountMinor, milestone.currency || invoice.currency);
    const posted = await postJournal({
      eventType: "invoice.milestone.funded",
      idempotencyKey: `invoice-payment-funded:${payment._id}:${milestone._id}`,
      sourceType: "invoice_payment",
      sourceId: payment._id,
      providerEventId: auditContext.providerEventId || payment.provider_reference || payment.provider_payment_id,
      requestId: auditContext.requestId || auditContext.correlationId || "system",
      actorId: auditContext.actor?._id || auditContext.actor?.id,
      actorRole: auditContext.actor?.role || "system",
      entries: [
        { accountBase: "provider_clearing", debitMinor: milestoneMoney.amountMinor, creditMinor: 0, currency: milestoneMoney.currency },
        { accountBase: "escrow_liability", debitMinor: 0, creditMinor: milestoneMoney.amountMinor, currency: milestoneMoney.currency },
      ],
      metadata: { invoiceId: invoice._id, milestoneId: milestone._id, providerPaymentId: payment.provider_payment_id },
    });
    journalIds.push(String(posted.journal._id));
    await Milestone.updateOne(
      { _id: milestone._id, status: { $in: ["not_funded", "funding_pending"] } },
      { $set: { status: "funded", funded_at: new Date() } }
    );
  }
  payment.status = "succeeded";
  payment.provider_event_id = auditContext.providerEventId || payment.provider_event_id || payment.provider_reference || payment.provider_payment_id;
  payment.ledger_journal_ids = journalIds;
  await payment.save();
  await Invoice.updateOne(
    { _id: invoice._id, reconciliation_status: { $ne: "reconciled" } },
    {
      $set: {
        status: "paid",
        paid_at: new Date(),
        provider_reference: payment.provider_reference || payment.provider_payment_id,
        ledger_journal_ids: journalIds,
        reconciliation_status: "reconciled",
        reconciled_at: new Date(),
      },
    }
  );
  return payment;
}

export async function failInvoicePayment(providerPaymentId, reason) {
  return InvoicePayment.findOneAndUpdate(
    { $or: [{ provider_payment_id: providerPaymentId }, { provider_reference: providerPaymentId }], status: { $in: ["created", "pending"] } },
    { $set: { status: "failed", failure_message: reason || "Provider payment failed" } },
    { new: true }
  );
}

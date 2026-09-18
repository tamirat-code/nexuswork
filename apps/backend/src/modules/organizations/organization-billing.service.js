import crypto from "node:crypto";
import Organization from "./organizations.model.js";
import Invoice from "../invoices/invoices.model.js";
import { legalConfig } from "../../config/legal.config.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

function assertAdmin(actor) {
  if (actor?.role !== "admin") throw new ForbiddenError("Only administrators can manage organization credit");
}

async function audit(actor, eventType, action, entityId, metadata, req) {
  return recordEvent({
    actor, eventType, action, entityType: "organization", entityId,
    previousState: null, newState: null, metadata,
    correlationId: req?.correlationId || req?.requestId || crypto.randomUUID(),
    requestId: req?.requestId,
  });
}

export async function approveOrganizationNet30({ organizationId, actor, creditLimitMinor, req }) {
  assertAdmin(actor);
  if (!legalConfig.net30Enabled) throw new ValidationError("NET-30 cannot be approved before legal approval is enabled");
  if (!Number.isSafeInteger(Number(creditLimitMinor)) || Number(creditLimitMinor) <= 0) {
    throw new ValidationError("A positive credit limit is required");
  }
  const organization = await Organization.findOneAndUpdate(
    { _id: organizationId, status: { $ne: "suspended" } },
    {
      $set: {
        billing_mode: "net_30",
        net30_approved: true,
        net30_approved_at: new Date(),
        net30_approved_by: actor._id,
        net30_policy_version: legalConfig.net30PolicyVersion,
        credit_limit_minor: Number(creditLimitMinor),
        overdue_since: null,
        suspension_reason: null,
      },
    },
    { new: true }
  );
  if (!organization) throw new NotFoundError("Organization not found or suspended");
  await audit(actor, "organization_net30_approved", "organization.net30_approved", organization._id, {
    credit_limit_minor: organization.credit_limit_minor,
    policy_version: legalConfig.net30PolicyVersion,
  }, req);
  return organization;
}

export async function updateOrganizationBillingState({ organizationId, actor, state, reason, req }) {
  assertAdmin(actor);
  if (!["active", "overdue", "suspended"].includes(state)) throw new ValidationError("Invalid organization billing state");
  const organization = await Organization.findById(organizationId);
  if (!organization) throw new NotFoundError("Organization not found");
  const previous = { status: organization.status, overdue_since: organization.overdue_since };
  if (state === "suspended") {
    organization.status = "suspended";
    organization.suspended_at = new Date();
    organization.suspension_reason = reason || "Billing collection suspension";
  } else {
    organization.status = "active";
    organization.suspended_at = null;
    organization.suspension_reason = null;
    organization.overdue_since = state === "overdue" ? (organization.overdue_since || new Date()) : null;
  }
  await organization.save();
  await audit(actor, "organization_billing_state_changed", "organization.billing_state_changed", organization._id, {
    previous, state, reason,
  }, req);
  return organization;
}

export async function recordOrganizationCollection({ invoiceId, actor, providerReference, req }) {
  assertAdmin(actor);
  if (!providerReference) throw new ValidationError("Provider reference is required to confirm collection");
  const invoice = await Invoice.findOne({ _id: invoiceId, invoice_type: "organization_consolidated" });
  if (!invoice) throw new NotFoundError("Organization invoice not found");
  if (invoice.reconciliation_status !== "reconciled") throw new ValidationError("Invoice is not reconciled against the financial ledger");
  if (!["sent", "overdue"].includes(invoice.status)) throw new ValidationError("Invoice cannot be collected from " + invoice.status);
  invoice.status = "paid";
  invoice.paid_at = new Date();
  invoice.provider_reference = providerReference;
  await invoice.save();
  if (invoice.billing_mode === "net_30") {
    await Organization.updateOne(
      { _id: invoice.organization_id },
      { $inc: { credit_used_minor: -Math.min(invoice.amount_minor || 0, Number.MAX_SAFE_INTEGER) }, $set: { overdue_since: null } }
    );
  }
  await audit(actor, "organization_invoice_collected", "organization.invoice_collected", invoice.organization_id, {
    invoice_id: invoice._id, provider_reference: providerReference,
  }, req);
  return invoice;
}

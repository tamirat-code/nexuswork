import ApiPartner from "./api-partners.model.js";
import ApiBillingLedger from "./api-billing-ledger.model.js";
import ApiWalletPayment from "./api-wallet-payment.model.js";
import { stripe } from "../payments/stripe.client.js";
import { getPaymentProvider } from "../payments/providers/index.js";
import { tierEtbPricing } from "./api-partners.service.js";
import { updatePartnerBillingStatus } from "./api-billing.service.js";
import { postJournal } from "../financial-ledger/financial-ledger.service.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

function canManagePartner(partner, actor) {
  return actor?.role === "admin" || String(partner.created_by) === String(actor?._id);
}

async function loadPartner(partnerId, actor) {
  const partner = await ApiPartner.findById(partnerId);
  if (!partner) throw new NotFoundError("API partner not found");
  if (!canManagePartner(partner, actor)) throw new ForbiddenError("You cannot manage this API partner billing");
  return partner;
}

export async function createStripeBillingSetupIntent({ partnerId, actor, req }) {
  const partner = await loadPartner(partnerId, actor);
  let customerId = partner.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: partner.organization_name || partner.name,
      email: partner.contact_email,
      metadata: { nexuswork_partner_id: String(partner._id) },
    });
    customerId = customer.id;
    partner.stripe_customer_id = customerId;
    await partner.save();
  }
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    payment_method_types: ["card"],
    metadata: { nexuswork_partner_id: String(partner._id) },
  });
  return { client_secret: setupIntent.client_secret, customer_id: customerId, setup_intent_id: setupIntent.id };
}

export async function saveStripePaymentMethod({ partnerId, paymentMethodId, actor }) {
  const partner = await loadPartner(partnerId, actor);
  if (!partner.stripe_customer_id) throw new ValidationError("Create a Stripe setup intent first");
  let method = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (method.customer && String(method.customer) !== String(partner.stripe_customer_id)) {
    throw new ValidationError("This payment method belongs to another Stripe customer");
  }
  if (!method.customer) method = await stripe.paymentMethods.attach(paymentMethodId, { customer: partner.stripe_customer_id });
  await stripe.customers.update(partner.stripe_customer_id, { invoice_settings: { default_payment_method: method.id } });
  partner.billing_mode = "stripe_usage";
  partner.stripe_payment_method_id = method.id;
  partner.stripe_payment_method_brand = method.card?.brand;
  partner.stripe_payment_method_last4 = method.card?.last4;
  await partner.save();
  return { billing_mode: partner.billing_mode, brand: method.card?.brand, last4: method.card?.last4 };
}

export async function chargePartnerUsageStatement({ ledgerId, actor = { role: "system" }, req }) {
  const ledger = await ApiBillingLedger.findById(ledgerId);
  if (!ledger) throw new NotFoundError("API billing statement not found");
  const partner = await ApiPartner.findById(ledger.partner_id);
  if (!partner) throw new NotFoundError("API partner not found");
  if (actor.role !== "system" && !canManagePartner(partner, actor)) throw new ForbiddenError("You cannot charge this API partner");
  if (partner.billing_mode !== "stripe_usage" || !partner.stripe_customer_id || !partner.stripe_payment_method_id) {
    throw new ValidationError("A saved Stripe payment method is required for automatic billing");
  }
  if (!["open", "overdue"].includes(ledger.status)) return ledger;
  if (ledger.status === "open") {
    await updatePartnerBillingStatus({
      partnerId: partner._id, ledgerId: ledger._id, status: "issued",
      actor, req,
    });
  }
  const amountMinor = Math.max(0, Number(ledger.amount_minor || 0));
  if (!amountMinor) {
    await ApiBillingLedger.updateOne({ _id: ledger._id }, { $set: { status: "paid", paid_at: new Date(), settlement_status: "confirmed", reconciliation_status: "reconciled" } });
    return ApiBillingLedger.findById(ledger._id);
  }
  const operationKey = `api-usage-charge-${ledger._id}-${ledger.payment_attempts + 1}`;
  const intent = await stripe.paymentIntents.create({
    amount: amountMinor,
    currency: ledger.currency,
    customer: partner.stripe_customer_id,
    payment_method: partner.stripe_payment_method_id,
    off_session: true,
    confirm: true,
    metadata: { api_billing_ledger_id: String(ledger._id), api_partner_id: String(partner._id) },
  }, { idempotencyKey: operationKey });
  await ApiBillingLedger.updateOne(
    { _id: ledger._id },
    { $set: { provider_payment_id: intent.id, settlement_status: "submitted" }, $inc: { payment_attempts: 1 } }
  );
  if (intent.status === "succeeded") {
    await settleStripeUsagePayment(intent.id, { actor, req });
  }
  return ApiBillingLedger.findById(ledger._id);
}

export async function settleStripeUsagePayment(providerPaymentId, { actor = { role: "system" }, req, providerEventId } = {}) {
  const ledger = await ApiBillingLedger.findOne({ provider_payment_id: providerPaymentId });
  if (!ledger) return null;
  if (ledger.status === "paid") return ledger;
  const intent = await stripe.paymentIntents.retrieve(providerPaymentId);
  if (intent.metadata?.api_billing_ledger_id && String(intent.metadata.api_billing_ledger_id) !== String(ledger._id)) {
    throw new ValidationError("Stripe payment does not belong to this billing statement");
  }
  if (intent.status !== "succeeded") return ledger;
  await updatePartnerBillingStatus({
    partnerId: ledger.partner_id,
    ledgerId: ledger._id,
    status: "paid",
    settlement_reference: providerPaymentId,
    actor,
    req: { ...req, requestId: req?.requestId || providerEventId, correlationId: req?.correlationId || providerEventId },
  });
  return ApiBillingLedger.findById(ledger._id);
}

export async function failStripeUsagePayment(providerPaymentId, reason) {
  const ledger = await ApiBillingLedger.findOne({ provider_payment_id: providerPaymentId });
  if (!ledger) return null;
  const attempts = Number(ledger.payment_attempts || 0);
  await ApiBillingLedger.updateOne(
    { _id: ledger._id, status: { $in: ["issued", "overdue"] } },
    { $set: { status: "overdue", settlement_status: "failed", settlement_error: reason || "Stripe payment failed", next_payment_attempt_at: new Date(Date.now() + 24 * 60 * 60 * 1000), failed_at: new Date() } }
  );
  if (attempts >= 2) {
    await ApiPartner.updateOne({ _id: ledger.partner_id, status: "active" }, { $set: { status: "suspended", suspended_at: new Date(), suspended_reason: "Automatic API usage payment failed after three attempts" } });
  }
  return ledger;
}

export async function markPartnerStatementOverdue(ledgerId, reason) {
  const ledger = await ApiBillingLedger.findById(ledgerId);
  if (!ledger) return null;
  const attempts = Number(ledger.payment_attempts || 0);
  await ApiBillingLedger.updateOne(
    { _id: ledger._id, status: { $in: ["open", "issued", "overdue"] } },
    { $set: { status: "overdue", settlement_status: "failed", settlement_error: reason || "Automatic payment is unavailable", next_payment_attempt_at: new Date(Date.now() + 24 * 60 * 60 * 1000), failed_at: new Date() }, $inc: { payment_attempts: 1 } }
  );
  if (attempts >= 2) {
    await ApiPartner.updateOne({ _id: ledger.partner_id, status: "active" }, { $set: { status: "suspended", suspended_at: new Date(), suspended_reason: "Automatic API usage payment failed after three attempts" } });
  }
  return ledger;
}

export async function createEtbWalletTopUp({ partnerId, amountMinor, actor }) {
  const partner = await loadPartner(partnerId, actor);
  if (!Number.isSafeInteger(Number(amountMinor)) || Number(amountMinor) < 100) throw new ValidationError("Top-up must be at least ETB 1");
  const operationKey = `api-wallet-topup-${partner._id}-${Date.now()}`;
  const provider = getPaymentProvider("chapa");
  const intent = await provider.createPaymentIntent({
    amountMinor: Number(amountMinor),
    currency: "etb",
    metadata: { api_partner_id: String(partner._id), wallet_topup: "true" },
    idempotencyKey: operationKey,
  });
  const payment = await ApiWalletPayment.create({
    partner_id: partner._id, amount_minor: Number(amountMinor), provider_payment_id: intent.id,
    provider_reference: intent.providerReference, checkout_url: intent.clientSecret, operation_key: operationKey,
  });
  return { payment_id: payment._id, payment_intent_id: intent.id, checkout_url: intent.clientSecret, amount_minor: payment.amount_minor, currency: "etb" };
}

export async function settleEtbWalletTopUp(providerPaymentId, { providerEventId } = {}) {
  const payment = await ApiWalletPayment.findOne({ $or: [{ provider_payment_id: providerPaymentId }, { provider_reference: providerPaymentId }] });
  if (!payment) return null;
  if (payment.status === "succeeded") return payment;
  const provider = getPaymentProvider("chapa");
  const intent = await provider.getPaymentIntent(payment.provider_payment_id);
  if (intent.status !== "succeeded") return payment;
  if (intent.metadata?.api_partner_id && String(intent.metadata.api_partner_id) !== String(payment.partner_id)) {
    throw new ValidationError("Chapa top-up does not belong to this API partner");
  }
  if (intent.amountMinor !== payment.amount_minor || String(intent.currency).toLowerCase() !== "etb") throw new ValidationError("Chapa top-up does not match the wallet payment");
  const posted = await postJournal({
    eventType: "api.wallet.topped_up",
    idempotencyKey: `api-wallet-topped-up:${payment._id}`,
    sourceType: "api_wallet_payment",
    sourceId: payment._id,
    providerEventId: providerEventId || payment.provider_reference || payment.provider_payment_id,
    entries: [
      { accountBase: "provider_clearing", debitMinor: payment.amount_minor, creditMinor: 0, currency: "etb" },
      { accountBase: "partner_prepaid_liability", debitMinor: 0, creditMinor: payment.amount_minor, currency: "etb" },
    ],
  });
  await ApiPartner.updateOne({ _id: payment.partner_id }, { $inc: { wallet_balance_minor: payment.amount_minor } });
  payment.status = "succeeded";
  payment.provider_event_id = providerEventId || payment.provider_event_id;
  payment.ledger_journal_id = String(posted.journal._id);
  await payment.save();
  return payment;
}

export function etbRequestCostMinor(partner) {
  return Math.max(1, Math.ceil(tierEtbPricing(partner.tier) / 1000));
}

export async function debitEtbWallet(partner, amountMinor) {
  return ApiPartner.findOneAndUpdate(
    { _id: partner._id, billing_mode: "prepaid_etb", wallet_balance_minor: { $gte: amountMinor }, status: "active" },
    { $inc: { wallet_balance_minor: -amountMinor } },
    { new: true }
  ).lean();
}

export async function creditEtbWallet(partnerId, amountMinor) {
  return ApiPartner.updateOne({ _id: partnerId, billing_mode: "prepaid_etb" }, { $inc: { wallet_balance_minor: amountMinor } });
}

export async function chargeDueStripePartnerStatements({ limit = 100 } = {}) {
  const now = new Date();
  const partnerIds = await ApiPartner.find({ billing_mode: "stripe_usage", status: "active" }).distinct("_id");
  const ledgers = await ApiBillingLedger.find({
    partner_id: { $in: partnerIds },
    status: { $in: ["open", "overdue"] },
    $or: [
      { status: "open", period_end: { $lte: now } },
      { status: "overdue", next_payment_attempt_at: { $lte: now } },
    ],
  }).sort({ period_end: 1 }).limit(Number(limit));
  const result = { checked: ledgers.length, charged: 0, failed: 0 };
  for (const ledger of ledgers) {
    try {
      await chargePartnerUsageStatement({ ledgerId: ledger._id });
      result.charged += 1;
    } catch (error) {
      result.failed += 1;
      await markPartnerStatementOverdue(ledger._id, error.message).catch(() => {});
    }
  }
  return result;
}

import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { approveOrganizationNet30, updateOrganizationBillingState, recordOrganizationCollection } from "./organization-billing.service.js";

export const approveNet30 = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await approveOrganizationNet30({
    organizationId: req.params.organizationId, actor: req.user,
    creditLimitMinor: req.body.credit_limit_minor, req,
  }) });
});

export const billingState = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateOrganizationBillingState({
    organizationId: req.params.organizationId, actor: req.user,
    state: req.body.state, reason: req.body.reason, req,
  }) });
});

export const collectInvoice = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await recordOrganizationCollection({
    invoiceId: req.params.invoiceId, actor: req.user,
    providerReference: req.body.provider_reference, req,
  }) });
});

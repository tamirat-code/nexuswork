import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../shared/validators/ZodValidator.js";
import {
  createPartnerSchema, submitPartnerApplicationSchema, createApiKeySchema, updatePartnerStatusSchema, apiPartnerParamsSchema, apiKeyParamsSchema, ownKeyParamsSchema, apiBillingStatusParamsSchema, updateApiBillingStatusSchema,
  talentSearchQuerySchema, createWebhookSubscriptionSchema, updateWebhookSubscriptionSchema, webhookParamsSchema, partnerLimitQuerySchema,
} from "./api-partners.validators.js";
import {
  create, apply, approve, list, get, keys, createKey, revokeKey, updateStatus, updateBillingStatus, profile, talentSearch,
  selfKeys, selfCreateKey, selfRevokeKey, usage, billing,
  adminBilling, webhooks, createWebhook, updateWebhook, rotateWebhook, disableWebhook, webhookDeliveries,
} from "./api-partners.controller.js";
import { requirePartnerApiKey, requirePartnerScope } from "./api-partners.middleware.js";

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", list);
adminRouter.post("/", validateBody(createPartnerSchema), create);
adminRouter.post("/:partnerId/approve", validateParams(apiPartnerParamsSchema), approve);
adminRouter.get("/:partnerId", validateParams(apiPartnerParamsSchema), get);
adminRouter.get("/:partnerId/keys", validateParams(apiPartnerParamsSchema), keys);
adminRouter.post("/:partnerId/keys", validateParams(apiPartnerParamsSchema), validateBody(createApiKeySchema), createKey);
adminRouter.patch("/:partnerId/status", validateParams(apiPartnerParamsSchema), validateBody(updatePartnerStatusSchema), updateStatus);
adminRouter.post("/:partnerId/keys/:keyId/revoke", validateParams(apiKeyParamsSchema), revokeKey);
adminRouter.get("/:partnerId/billing", validateParams(apiPartnerParamsSchema), validateQuery(partnerLimitQuerySchema), adminBilling);
adminRouter.patch("/:partnerId/billing/:ledgerId/status", validateParams(apiBillingStatusParamsSchema), validateBody(updateApiBillingStatusSchema), updateBillingStatus);

const partnerRouter = Router();
partnerRouter.use(requirePartnerApiKey);
partnerRouter.get("/me", profile);
partnerRouter.get("/talent/search", requirePartnerScope("talent:read"), validateQuery(talentSearchQuerySchema), talentSearch);
partnerRouter.get("/me/keys", selfKeys);
partnerRouter.post("/me/keys", validateBody(createApiKeySchema), selfCreateKey);
partnerRouter.post("/me/keys/:keyId/revoke", validateParams(ownKeyParamsSchema), selfRevokeKey);
partnerRouter.get("/me/usage", requirePartnerScope("usage:read"), usage);
partnerRouter.get("/me/billing", requirePartnerScope("usage:read"), billing);
partnerRouter.get("/me/webhooks", requirePartnerScope("webhooks:manage"), webhooks);
partnerRouter.post("/me/webhooks", requirePartnerScope("webhooks:manage"), validateBody(createWebhookSubscriptionSchema), createWebhook);
partnerRouter.patch("/me/webhooks/:subscriptionId", requirePartnerScope("webhooks:manage"), validateParams(webhookParamsSchema), validateBody(updateWebhookSubscriptionSchema), updateWebhook);
partnerRouter.post("/me/webhooks/:subscriptionId/rotate-secret", requirePartnerScope("webhooks:manage"), validateParams(webhookParamsSchema), rotateWebhook);
partnerRouter.delete("/me/webhooks/:subscriptionId", requirePartnerScope("webhooks:manage"), validateParams(webhookParamsSchema), disableWebhook);
partnerRouter.get("/me/webhook-deliveries", requirePartnerScope("webhooks:manage"), validateQuery(partnerLimitQuerySchema), webhookDeliveries);

export { adminRouter as ApiPartnerAdminRoutes };
export default partnerRouter;

export const ApiPartnerApplicationRoutes = Router();
ApiPartnerApplicationRoutes.use(requireAuth);
ApiPartnerApplicationRoutes.post("/", validateBody(submitPartnerApplicationSchema), apply);

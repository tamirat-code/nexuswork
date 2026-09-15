import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import {
  createPartnerSchema, createApiKeySchema, updatePartnerStatusSchema, apiPartnerParamsSchema, apiKeyParamsSchema,
} from "./api-partners.validators.js";
import { create, list, get, keys, createKey, revokeKey, updateStatus, profile } from "./api-partners.controller.js";
import { requirePartnerApiKey } from "./api-partners.middleware.js";

const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.get("/", list);
adminRouter.post("/", validateBody(createPartnerSchema), create);
adminRouter.get("/:partnerId", validateParams(apiPartnerParamsSchema), get);
adminRouter.get("/:partnerId/keys", validateParams(apiPartnerParamsSchema), keys);
adminRouter.post("/:partnerId/keys", validateParams(apiPartnerParamsSchema), validateBody(createApiKeySchema), createKey);
adminRouter.patch("/:partnerId/status", validateParams(apiPartnerParamsSchema), validateBody(updatePartnerStatusSchema), updateStatus);
adminRouter.post("/:partnerId/keys/:keyId/revoke", validateParams(apiKeyParamsSchema), revokeKey);

const partnerRouter = Router();
partnerRouter.use(requirePartnerApiKey);
partnerRouter.get("/me", profile);

export { adminRouter as ApiPartnerAdminRoutes };
export default partnerRouter;

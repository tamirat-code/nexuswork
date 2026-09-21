import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";
import {
  createOrganizationSchema, updateOrganizationSchema, inviteMemberSchema, updateMemberSchema, onboardingRequestSchema, onboardingDecisionSchema, organizationMemberParamsSchema,
  organizationNet30Schema, organizationBillingStateSchema, organizationCollectionSchema, organizationSsoSchema,
} from "./organizations.validators.js";
import {
  create, updateOrganization, mine, getOne, members, invite, update, remove, requestInstitution, onboardingRequests, decideOnboarding, institutions, myInstitutionRequests, myInstitutions,
  approveNet30, billingState, collectInvoice, getSso, updateSso,
} from "./organizations.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/mine", mine);
router.get("/institutions", institutions);
router.get("/institutions/mine", myInstitutions);
router.post("/", validateBody(createOrganizationSchema), create);
router.post("/institution-onboarding", requireRole("university_staff", "admin"), validateBody(onboardingRequestSchema), requestInstitution);
router.get("/institution-onboarding/mine", requireRole("university_staff", "admin"), myInstitutionRequests);
router.get("/institution-onboarding", requireRole("admin"), onboardingRequests);
router.patch("/institution-onboarding/:requestId", requireRole("admin"), validateParams(objectIdParamsSchema("requestId")), validateBody(onboardingDecisionSchema), decideOnboarding);

router.get("/:organizationId", validateParams(objectIdParamsSchema("organizationId")), getOne);
router.patch("/:organizationId", validateParams(objectIdParamsSchema("organizationId")), validateBody(updateOrganizationSchema), updateOrganization);
router.get("/:organizationId/members", validateParams(objectIdParamsSchema("organizationId")), members);
router.get("/:organizationId/sso", validateParams(objectIdParamsSchema("organizationId")), getSso);
router.put("/:organizationId/sso", validateParams(objectIdParamsSchema("organizationId")), validateBody(organizationSsoSchema), updateSso);
router.post("/:organizationId/members", validateParams(objectIdParamsSchema("organizationId")), validateBody(inviteMemberSchema), invite);
router.patch("/:organizationId/members/:userId", validateParams(organizationMemberParamsSchema), validateBody(updateMemberSchema), update);
router.delete("/:organizationId/members/:userId", validateParams(organizationMemberParamsSchema), remove);
router.post("/:organizationId/net30/approve", requireRole("admin"), validateParams(objectIdParamsSchema("organizationId")), validateBody(organizationNet30Schema), approveNet30);
router.patch("/:organizationId/billing-state", requireRole("admin"), validateParams(objectIdParamsSchema("organizationId")), validateBody(organizationBillingStateSchema), billingState);
router.post("/invoices/:invoiceId/collect", requireRole("admin"), validateParams(objectIdParamsSchema("invoiceId")), validateBody(organizationCollectionSchema), collectInvoice);

export default router;

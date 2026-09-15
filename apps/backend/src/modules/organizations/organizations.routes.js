import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateBody, validateParams } from "../../shared/validators/ZodValidator.js";
import { objectIdParamsSchema } from "../../shared/validators/schemas.js";
import {
  createOrganizationSchema, inviteMemberSchema, updateMemberSchema, onboardingRequestSchema, onboardingDecisionSchema, organizationMemberParamsSchema,
} from "./organizations.validators.js";
import {
  create, mine, getOne, members, invite, update, remove, requestInstitution, onboardingRequests, decideOnboarding, institutions, myInstitutionRequests, myInstitutions,
} from "./organizations.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/mine", mine);
router.get("/institutions", institutions);
router.get("/institutions/mine", myInstitutions);
router.post("/", validateBody(createOrganizationSchema), create);
router.post("/institution-onboarding", validateBody(onboardingRequestSchema), requestInstitution);
router.get("/institution-onboarding/mine", myInstitutionRequests);
router.get("/institution-onboarding", requireRole("admin"), onboardingRequests);
router.patch("/institution-onboarding/:requestId", requireRole("admin"), validateParams(objectIdParamsSchema("requestId")), validateBody(onboardingDecisionSchema), decideOnboarding);

router.get("/:organizationId", validateParams(objectIdParamsSchema("organizationId")), getOne);
router.get("/:organizationId/members", validateParams(objectIdParamsSchema("organizationId")), members);
router.post("/:organizationId/members", validateParams(objectIdParamsSchema("organizationId")), validateBody(inviteMemberSchema), invite);
router.patch("/:organizationId/members/:userId", validateParams(organizationMemberParamsSchema), validateBody(updateMemberSchema), update);
router.delete("/:organizationId/members/:userId", validateParams(organizationMemberParamsSchema), remove);

export default router;

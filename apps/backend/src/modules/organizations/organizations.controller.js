import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import {
  createOrganization, listMyOrganizations, getOrganization, listMembers, inviteMember, updateMember, removeMember,
  submitOnboardingRequest, listOnboardingRequests, decideOnboardingRequest,
  listActiveInstitutions, listMyInstitutionRequests, listMyInstitutions,
} from "./organizations.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await createOrganization({ actor: req.user, ...req.body, req }) }));
export const mine = asyncHandler(async (req, res) => res.json({ success: true, data: await listMyOrganizations(req.user._id) }));
export const getOne = asyncHandler(async (req, res) => res.json({ success: true, data: await getOrganization(req.params.organizationId, req.user._id) }));
export const members = asyncHandler(async (req, res) => res.json({ success: true, data: await listMembers(req.params.organizationId, req.user._id) }));
export const invite = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await inviteMember(req.params.organizationId, req.user, req.body, req) }));
export const update = asyncHandler(async (req, res) => res.json({ success: true, data: await updateMember(req.params.organizationId, req.user, req.params.userId, req.body.role, req) }));
export const remove = asyncHandler(async (req, res) => res.json({ success: true, data: await removeMember(req.params.organizationId, req.user, req.params.userId, req) }));
export const requestInstitution = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await submitOnboardingRequest(req.user, req.body, req) }));
export const institutions = asyncHandler(async (req, res) => res.json({ success: true, data: await listActiveInstitutions() }));
export const myInstitutionRequests = asyncHandler(async (req, res) => res.json({ success: true, data: await listMyInstitutionRequests(req.user._id) }));
export const myInstitutions = asyncHandler(async (req, res) => res.json({ success: true, data: await listMyInstitutions(req.user._id, req.user.role) }));
export const onboardingRequests = asyncHandler(async (req, res) => res.json({ success: true, data: await listOnboardingRequests(req.query.status || "pending") }));
export const decideOnboarding = asyncHandler(async (req, res) => res.json({ success: true, data: await decideOnboardingRequest(req.user, req.params.requestId, req.body, req) }));

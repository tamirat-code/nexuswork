import Organization from "./organizations.model.js";
import Institution from "./institutions.model.js";
import OrgMembership from "./org-membership.model.js";
import InstitutionOnboardingRequest from "./institution-onboarding-request.model.js";
import User from "../users/users.model.js";
import File from "../files/files.model.js";
import University from "../universities/universities.model.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

const ORG_ROLES = ["admin", "recruiter", "billing_viewer"];

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function audit(actor, eventType, action, entityType, entityId, metadata = {}, req = {}) {
  await recordEvent({
    actor,
    eventType,
    action,
    entityType,
    entityId,
    correlationId: req.id || `org-${entityId}-${Date.now()}`,
    requestId: req.id,
    metadata,
    ipAddress: req.ip,
    userAgent: req.get?.("user-agent"),
  });
}

export async function getOrganizationMembership(organizationId, userId) {
  return OrgMembership.findOne({ organization_id: organizationId, user_id: userId, status: "active" });
}

export async function requireOrganizationRole(organizationId, userId, roles = ORG_ROLES) {
  const membership = await getOrganizationMembership(organizationId, userId);
  if (!membership) throw new ForbiddenError("You are not an active member of this organization");
  if (!roles.includes(membership.role)) throw new ForbiddenError("Your organization role cannot perform this action");
  return membership;
}

export async function createOrganization({ actor, name, institution_id, billing_mode, req }) {
  if (!(["client", "admin"].includes(actor.role))) throw new ForbiddenError("Only client accounts can create organizations");
  if (institution_id) {
    const institution = await Institution.findOne({ _id: institution_id, status: "active" });
    if (!institution) throw new NotFoundError("Institution not found");
  }
  const organization = await Organization.create({ name, institution_id: institution_id || null, owner_id: actor._id, billing_mode });
  await OrgMembership.create({ organization_id: organization._id, user_id: actor._id, role: "admin", invited_by: actor._id });
  await audit(actor, "organization_created", "organization_created", "organization", organization._id, { organization_name: name }, req);
  return Organization.findById(organization._id).populate("institution_id", "name domain").lean();
}

export async function listMyOrganizations(userId) {
  const memberships = await OrgMembership.find({ user_id: userId, status: "active" })
    .populate({ path: "organization_id", populate: { path: "institution_id", select: "name domain" } })
    .sort({ createdAt: -1 })
    .lean();
  return memberships.map((membership) => ({ ...membership.organization_id, membership: { _id: membership._id, role: membership.role } }));
}

export async function getOrganization(organizationId, userId) {
  await requireOrganizationRole(organizationId, userId);
  const organization = await Organization.findById(organizationId).populate("institution_id", "name domain brandingConfig").lean();
  if (!organization) throw new NotFoundError("Organization not found");
  return organization;
}

export async function listMembers(organizationId, userId) {
  await requireOrganizationRole(organizationId, userId);
  return OrgMembership.find({ organization_id: organizationId, status: "active" })
    .populate("user_id", "name email role status")
    .populate("invited_by", "name email")
    .sort({ role: 1, createdAt: 1 })
    .lean();
}

export async function inviteMember(organizationId, actor, { email, role }, req) {
  await requireOrganizationRole(organizationId, actor._id, ["admin"]);
  if (!ORG_ROLES.includes(role)) throw new ValidationError("Invalid organization role");
  const user = await User.findOne({ email: email.toLowerCase(), status: "active" });
  if (!user) throw new NotFoundError("An active NexusWork user with that email was not found");
  if (user.role !== "client") throw new ValidationError("Organization members must have a client account");
  const existing = await OrgMembership.findOne({ organization_id: organizationId, user_id: user._id });
  if (existing?.status === "active") throw new ConflictError("This user is already an organization member");
  const membership = existing
    ? await OrgMembership.findByIdAndUpdate(existing._id, { role, status: "active", invited_by: actor._id, removed_at: null, joined_at: new Date() }, { new: true })
    : await OrgMembership.create({ organization_id: organizationId, user_id: user._id, role, invited_by: actor._id });
  await audit(actor, "organization_member_invited", "organization_member_invited", "org_membership", membership._id, { organization_id: organizationId, user_id: user._id, role }, req);
  return membership.populate("user_id", "name email role status");
}

export async function updateMember(organizationId, actor, userId, role, req) {
  await requireOrganizationRole(organizationId, actor._id, ["admin"]);
  const membership = await OrgMembership.findOne({ organization_id: organizationId, user_id: userId, status: "active" });
  if (!membership) throw new NotFoundError("Organization member not found");
  if (!ORG_ROLES.includes(role)) throw new ValidationError("Invalid organization role");
  membership.role = role;
  await membership.save();
  await audit(actor, "organization_member_role_changed", "organization_member_role_changed", "org_membership", membership._id, { organization_id: organizationId, user_id: userId, role }, req);
  return membership.populate("user_id", "name email role status");
}

export async function removeMember(organizationId, actor, userId, req) {
  await requireOrganizationRole(organizationId, actor._id, ["admin"]);
  const membership = await OrgMembership.findOne({ organization_id: organizationId, user_id: userId, status: "active" });
  if (!membership) throw new NotFoundError("Organization member not found");
  if (String(userId) === String(actor._id)) throw new ValidationError("The organization owner cannot remove their own membership");
  if (membership.role === "admin") {
    const adminCount = await OrgMembership.countDocuments({ organization_id: organizationId, role: "admin", status: "active" });
    if (adminCount <= 1) throw new ValidationError("An organization must retain at least one admin");
  }
  membership.status = "removed";
  membership.removed_at = new Date();
  await membership.save();
  await audit(actor, "organization_member_removed", "organization_member_removed", "org_membership", membership._id, { organization_id: organizationId, user_id: userId }, req);
  return { removed: true };
}

export async function submitOnboardingRequest(actor, payload, req) {
  const domain = normalizeDomain(payload.domain);
  const evidence = await File.findOne({ _id: payload.evidence_file_id, owner_id: actor._id, related_type: "institution_onboarding_evidence" });
  if (!evidence) throw new ForbiddenError("Upload institution evidence before submitting the request");
  if (await Institution.exists({ domain })) throw new ConflictError("An institution with this domain already exists");
  if (await InstitutionOnboardingRequest.exists({ domain, status: "pending" })) throw new ConflictError("An onboarding request for this domain is already pending");
  const request = await InstitutionOnboardingRequest.create({ ...payload, domain, requested_by: actor._id });
  await audit(actor, "institution_onboarding_requested", "institution_onboarding_requested", "institution_onboarding_request", request._id, { domain }, req);
  return request;
}

export async function listActiveInstitutions() {
  return Institution.find({ status: "active" }).select("name domain university_id").sort({ name: 1 }).lean();
}

export async function listMyInstitutionRequests(userId) {
  return InstitutionOnboardingRequest.find({ requested_by: userId })
    .populate("reviewedBy", "name email")
    .populate("provisioned_institution_id", "name domain status university_id")
    .populate("evidence_file_id", "original_name mimetype size")
    .sort({ createdAt: -1 })
    .lean();
}

export async function listMyInstitutions(userId, role) {
  const query = role === "admin" ? { status: "active" } : { status: "active", staff_admin_ids: userId };
  return Institution.find(query).populate("university_id", "name domain contact_staff").sort({ name: 1 }).lean();
}

export async function listOnboardingRequests(status = "pending") {
  const query = status === "all" ? {} : { status };
  return InstitutionOnboardingRequest.find(query).populate("requested_by", "name email role").populate("reviewedBy", "name email").populate("evidence_file_id", "original_name mimetype size url").sort({ createdAt: -1 }).lean();
}

export async function decideOnboardingRequest(actor, requestId, { decision, rejectionReason }, req) {
  const request = await InstitutionOnboardingRequest.findById(requestId);
  if (!request) throw new NotFoundError("Institution onboarding request not found");
  if (request.status !== "pending") throw new ConflictError("This onboarding request has already been decided");
  if (decision === "rejected") {
    request.status = "rejected";
    request.rejectionReason = rejectionReason || "The request was not approved";
    request.reviewedBy = actor._id;
    request.reviewedAt = new Date();
    await request.save();
    await audit(actor, "institution_onboarding_rejected", "institution_onboarding_rejected", "institution_onboarding_request", request._id, { domain: request.domain, rejectionReason: request.rejectionReason }, req);
    return request;
  }
  const existing = await Institution.findOne({ domain: request.domain });
  if (existing) throw new ConflictError("An institution with this domain already exists");
  const university = await University.findOneAndUpdate(
    { domain: request.domain },
    {
      $setOnInsert: { name: request.institutionName, domain: request.domain },
      $addToSet: { contact_staff: request.requested_by },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const institution = await Institution.create({
    name: request.institutionName,
    domain: request.domain,
    university_id: university._id,
    verificationContact: { name: request.contactName, email: request.contactEmail, title: request.contactTitle },
    staff_admin_ids: [request.requested_by],
  });
  request.status = "approved";
  request.reviewedBy = actor._id;
  request.reviewedAt = new Date();
  request.provisioned_institution_id = institution._id;
  await request.save();
  await audit(actor, "institution_onboarding_approved", "institution_onboarding_approved", "institution", institution._id, { request_id: request._id, domain: request.domain }, req);
  return request.populate("provisioned_institution_id", "name domain status university_id");
}

export { ORG_ROLES };

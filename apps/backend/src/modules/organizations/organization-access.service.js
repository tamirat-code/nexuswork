import Organization from "./organizations.model.js";
import OrgMembership from "./org-membership.model.js";
import { ForbiddenError, NotFoundError } from "../../shared/exceptions/AppError.js";

export const ORGANIZATION_ROLES = {
  ADMIN: "admin",
  RECRUITER: "recruiter",
  BILLING_VIEWER: "billing_viewer",
};

export async function getOrganizationMembershipForUser(organizationId, userId) {
  if (!organizationId || !userId) return null;
  const organization = await Organization.findOne({ _id: organizationId, status: "active" }).select("_id owner_id status").lean();
  if (!organization) return null;
  if (String(organization.owner_id) === String(userId)) return { organization, role: ORGANIZATION_ROLES.ADMIN, owner: true };
  const membership = await OrgMembership.findOne({ organization_id: organizationId, user_id: userId, status: "active" }).lean();
  return membership ? { organization, role: membership.role, owner: false } : null;
}

export async function requireOrganizationAccess(organizationId, userId, allowedRoles) {
  const access = await getOrganizationMembershipForUser(organizationId, userId);
  if (!access) throw new ForbiddenError("You are not an active member of this organization");
  if (allowedRoles && !allowedRoles.includes(access.role)) throw new ForbiddenError("Your organization role cannot access this resource");
  return access;
}

export async function requireOrganizationResourceAccess(organizationId, userId, allowedRoles) {
  if (!organizationId) throw new NotFoundError("Organization scope is missing from this resource");
  return requireOrganizationAccess(organizationId, userId, allowedRoles);
}

export async function listOrganizationIdsForUser(userId, allowedRoles = ["admin", "recruiter", "billing_viewer"]) {
  const [owned, memberships] = await Promise.all([
    Organization.find({ owner_id: userId, status: "active" }).distinct("_id"),
    OrgMembership.find({ user_id: userId, role: { $in: allowedRoles }, status: "active" }).distinct("organization_id"),
  ]);
  return [...new Set([...owned, ...memberships].map(String))];
}

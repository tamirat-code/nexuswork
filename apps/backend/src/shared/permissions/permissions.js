import { ROLES } from "../enums/roles.enum.js";

export const permissions = {
  canPostProject: (role) => role === ROLES.CLIENT,
  canSubmitProposal: (role) => role === ROLES.STUDENT,
  canApproveVerification: (role) => role === ROLES.UNIVERSITY_STAFF || role === ROLES.ADMIN,
  canManagePlatform: (role) => role === ROLES.ADMIN,
};

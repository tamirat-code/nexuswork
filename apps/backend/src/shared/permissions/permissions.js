import { ROLES } from "../enums/roles.enum.js";

export const permissions = {
  canPostProject: (role) => role === ROLES.CLIENT,
  canSubmitProposal: (role) => role === ROLES.STUDENT,
  canApproveVerification: (role) => role === ROLES.UNIVERSITY_STAFF || role === ROLES.ADMIN,
  canManagePlatform: (role) => role === ROLES.ADMIN,

  contract: {
    read: [ROLES.CLIENT, ROLES.STUDENT, ROLES.ADMIN],
    review: [ROLES.CLIENT, ROLES.STUDENT, ROLES.UNIVERSITY_STAFF, ROLES.ADMIN],
    sign: [ROLES.CLIENT, ROLES.STUDENT],
    activate: [ROLES.CLIENT, ROLES.STUDENT, ROLES.ADMIN],
  },
  milestone: {
    create: [ROLES.CLIENT],
    read: [ROLES.CLIENT, ROLES.STUDENT],
    fund: [ROLES.CLIENT],
    submit: [ROLES.STUDENT],
    approve: [ROLES.CLIENT],
    revision: [ROLES.CLIENT],
    release: [ROLES.CLIENT],
    dispute: [ROLES.CLIENT, ROLES.STUDENT],
  },
  submission: {
    read: [ROLES.CLIENT, ROLES.STUDENT],
    submit: [ROLES.STUDENT],
    approve: [ROLES.CLIENT],
    revision: [ROLES.CLIENT],
  },
  dispute: {
    read: [ROLES.CLIENT, ROLES.STUDENT, ROLES.UNIVERSITY_STAFF, ROLES.ADMIN],
    open: [ROLES.CLIENT, ROLES.STUDENT],
    resolve: [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN],
  },
  file: {
    read: [ROLES.CLIENT, ROLES.STUDENT],
    upload: [ROLES.CLIENT, ROLES.STUDENT],
    delete: [ROLES.CLIENT, ROLES.STUDENT],
  },
  message: {
    read: [ROLES.CLIENT, ROLES.STUDENT],
    create: [ROLES.CLIENT, ROLES.STUDENT],
  },
  invoice: {
    read: [ROLES.CLIENT, ROLES.STUDENT],
    create: [ROLES.CLIENT],
    update: [ROLES.CLIENT],
  },
  payment: {
    fund: [ROLES.CLIENT],
    release: [ROLES.CLIENT],
    refund: [ROLES.CLIENT, ROLES.ADMIN],
  },
};

export const PERMISSIONS = {
  student: [
    "projects.view",
    "proposals.create",
    "contracts.view",
    "wallet.view",
    "portfolio.manage",
  ],
  client: [
    "projects.create",
    "proposals.review",
    "contracts.view",
    "wallet.view",
    "invoices.view",
  ],
  university_staff: [
    "verifications.review",
    "skills.certify",
    "analytics.view",
  ],
  admin: [
    "users.manage",
    "disputes.resolve",
    "categories.manage",
    "reports.view",
    "audit.view",
    "analytics.view",
  ],
};

export function can(user, action) {
  return Boolean(user && (PERMISSIONS[user.role] || []).includes(action));
}

export function usePermission() {
  // import useAuth where used: const { user } = useAuth(); return (a) => can(user, a);
  return can;
}
export const PERMISSIONS = {
  student: [
    "projects.view",
    "proposals.create",
    "contracts.view",
    "wallet.view",
    "portfolio.manage",
  ],
  client: [
    "projects.create",
    "proposals.review",
    "contracts.view",
    "wallet.view",
    "invoices.view",
  ],
  university_staff: [
    "verifications.review",
    "skills.certify",
    "analytics.view",
  ],
  admin: [
    "users.manage",
    "disputes.resolve",
    "categories.manage",
    "reports.view",
    "audit.view",
    "analytics.view",
  ],
};

export function can(user, action) {
  return Boolean(user && (PERMISSIONS[user.role] || []).includes(action));
}

export function usePermission() {
  // import useAuth where used: const { user } = useAuth(); return (a) => can(user, a);
  return can;
}

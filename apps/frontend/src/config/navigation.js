import { ROLES } from "../constants/roles.constants.js";

export const marketingNav = [
  { to: "/projects", label: "Browse projects" },
  { to: "/students", label: "Find talent" },
  { to: "/universities", label: "For universities" },
];

const ALL = [ROLES.STUDENT, ROLES.CLIENT, ROLES.UNIVERSITY_STAFF, ROLES.ADMIN];

export const workspaceNav = [
  {
    section: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: "grid", roles: ALL, exact: true },
      { to: "/notifications", label: "Notifications", icon: "bell", roles: ALL },
      { to: "/chat", label: "Messages", icon: "chat", roles: ALL },
    ],
  },
  {
    section: "Work",
    items: [
      { to: "/projects", label: "Projects", icon: "briefcase", roles: ALL },
      { to: "/projects/new", label: "Post a project", icon: "plus", roles: [ROLES.CLIENT] },
      { to: "/proposals", label: "Proposals", icon: "document", roles: [ROLES.STUDENT, ROLES.CLIENT] },
      { to: "/contracts", label: "Contracts", icon: "shield", roles: [ROLES.STUDENT, ROLES.CLIENT] },
      { to: "/disputes", label: "Disputes", icon: "flag", roles: [ROLES.STUDENT, ROLES.CLIENT, ROLES.ADMIN] },
    ],
  },
  {
    section: "Money",
    items: [
      { to: "/wallet", label: "Wallet", icon: "wallet", roles: [ROLES.STUDENT, ROLES.CLIENT] },
      { to: "/payments", label: "Payments", icon: "card", roles: [ROLES.STUDENT, ROLES.CLIENT] },
      { to: "/invoices", label: "Invoices", icon: "receipt", roles: [ROLES.STUDENT, ROLES.CLIENT] },
    ],
  },
  {
    section: "Grow",
    items: [
      { to: "/portfolios", label: "Portfolio", icon: "sparkle", roles: [ROLES.STUDENT] },
      { to: "/skills", label: "Skills", icon: "spark", roles: [ROLES.STUDENT] },
      { to: "/learning", label: "Learning", icon: "book", roles: [ROLES.STUDENT] },
      { to: "/students", label: "Talent", icon: "users", roles: [ROLES.CLIENT, ROLES.UNIVERSITY_STAFF, ROLES.ADMIN] },
      { to: "/clients", label: "Clients", icon: "building", roles: [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN] },
      { to: "/analytics", label: "Analytics", icon: "chart", roles: [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN] },
      { to: "/admin", label: "Admin", icon: "cog", roles: [ROLES.ADMIN] },
    ],
  },
];

/** Sidebar sections with items the given role may see; empty sections dropped. */
export function navForRole(role) {
  return workspaceNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Paths that render inside the signed-in workspace shell (sidebar + topbar). */
export const WORKSPACE_PATHS = [
  "/dashboard",
  "/notifications",
  "/chat",
  "/proposals",
  "/contracts",
  "/disputes",
  "/wallet",
  "/payments",
  "/invoices",
  "/portfolios",
  "/skills",
  "/learning",
  "/clients",
  "/analytics",
  "/admin",
  "/settings",
  "/profile",
  "/recommendations",
];

/** Auth screens own the full viewport — no header, no footer. */
export const STANDALONE_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];


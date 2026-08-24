import { ROLES } from "../constants/roles.constants.js";

export const marketingNav = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/projects", label: "Browse projects", icon: "briefcase" },
  { to: "/students", label: "Find talent", icon: "users" },
  { to: "/universities", label: "For universities", icon: "building" },
  { to: "/#how-it-works", label: "How it works", icon: "spark" },
  { to: "/#faq", label: "FAQ", icon: "help" },
  { to: "/search", label: "Search", icon: "search" },
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
      {
        to: "/universities",
        label: "Verifications",
        icon: "shield",
        roles: [ROLES.UNIVERSITY_STAFF, ROLES.ADMIN],
      },
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
      { to: "/recommendations", label: "AI matches", icon: "sparkle", roles: [ROLES.STUDENT] },
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


export const WORKSPACE_PATHS = [
  "/dashboard",
  "/notifications",
  "/chat",
  "/projects",
  "/proposals",
  "/contracts",
  "/disputes",
  "/wallet",
  "/payments",
  "/invoices",
  "/portfolios",
  "/skills",
  "/learning",
  "/students",
  "/clients",
  "/universities",
  "/analytics",
  "/admin",
  "/settings",
  "/profile",
  "/recommendations",
];

// Paths above that must match exactly, never as a prefix — because a sibling dynamic
// route under the same segment is public (e.g. "/profile/:id" is a student's public
// profile page, not a subpage of "/profile"). Prefix-matching these would pull the
// signed-in workspace chrome (sidebar) around a page that is meant to render the same
// for everyone, logged in or not.
export const WORKSPACE_EXACT_PATHS = ["/profile"];


export const STANDALONE_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];


export function getWorkspacePageMeta(pathname) {
  let best = null;
  for (const group of workspaceNav) {
    for (const item of group.items) {
      const isMatch = pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (isMatch && (!best || item.to.length > best.to.length)) {
        best = { ...item, section: group.section };
      }
    }
  }
  return best;
}
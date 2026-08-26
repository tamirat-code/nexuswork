import { NavLink, Link } from "react-router-dom";
import { navForRole } from "../../config/navigation.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import NavIcon from "./NavIcon.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { cn } from "../../lib/cn.js";

/**
 * Sidebar — Quiet navigation canvas supporting page hierarchy.
 * Clean section grouping, subtle hover states, brand-soft active indicator.
 */
export default function Sidebar({ role, onNavigate, showBrand = false, className = "" }) {
  const { user } = useAuth();
  const groups = navForRole(role || user?.role);

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className={cn("flex h-full flex-col justify-between overflow-y-auto bg-sidebar-bg px-3 py-4", className)}>
      <nav aria-label="Workspace" className="flex flex-col gap-4">
        {showBrand && (
          <Link to="/" onClick={onNavigate} className="mb-2 flex items-center gap-2.5 px-2 py-1">
            <SealMark className="h-6 w-6 text-brand" />
            <span className="font-display text-base font-bold tracking-tight text-content-primary">
              NexusWork
            </span>
          </Link>
        )}

        {groups.map((group) => (
          <div key={group.section}>
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-content-muted">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.exact}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "relative flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
                        isActive
                          ? "bg-brand-soft font-semibold text-brand before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-1 before:rounded-r-full before:bg-brand"
                          : "text-content-secondary hover:bg-surface-soft hover:text-content-primary"
                      )
                    }
                  >
                    <NavIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-75" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User profile section ── */}
      {user && (
        <div className="border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors hover:bg-surface-soft">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-border-subtle"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-content-primary">{user.name || user.email}</p>
              <p className="truncate text-[10px] text-content-muted">{ROLE_LABELS[user.role] || "Member"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { NavLink, Link } from "react-router-dom";
import { navForRole } from "../../config/navigation.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import NavIcon from "./NavIcon.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { cn } from "../../lib/cn.js";

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
    <div className={cn("flex h-full flex-col justify-between overflow-y-auto px-3 py-5", className)}>
      <nav aria-label="Workspace" className="flex flex-col gap-5">
        {showBrand && (
          <Link to="/" onClick={onNavigate} className="mb-1 flex items-center gap-2.5 px-2 py-1">
            <SealMark className="h-7 w-7 text-brass" />
            <span className="font-display text-base font-bold tracking-tight text-slate">NexusWork</span>
          </Link>
        )}

        {groups.map((group) => (
          <div key={group.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
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
                        "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-1 focus-visible:ring-offset-ink",
                        isActive
                          ? "bg-brass/15 text-brass"
                          : "text-slate-300 hover:bg-ink-50 hover:text-slate"
                      )
                    }
                  >
                    <NavIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Static profile display — no click, no dropdown ── */}
      {user && (
        <div className="border-t border-ink-300 pt-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-ink-300"
              />
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brass/20 text-[11px] font-bold text-brass">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate">{user.name || user.email}</p>
              <p className="truncate text-[10px] text-slate-300">{ROLE_LABELS[user.role] || "Member"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
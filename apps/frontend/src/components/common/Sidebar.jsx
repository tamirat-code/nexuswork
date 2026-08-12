import { NavLink, Link } from "react-router-dom";
import { navForRole } from "../../config/navigation.js";
import { SealMark } from "../../features/auth/components/AuthShell.jsx";
import NavIcon from "./NavIcon.jsx";
import { cn } from "../../lib/cn.js";


export default function Sidebar({ role, onNavigate, showBrand = false, className = "" }) {
  const groups = navForRole(role);

  return (
    <nav aria-label="Workspace" className={cn("flex h-full flex-col gap-6 overflow-y-auto px-3 py-5", className)}>
      {showBrand && (
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-2.5">
          <SealMark className="h-6 w-6 text-brass" />
          <span className="font-display text-lg text-slate">NexusWork</span>
        </Link>
      )}

      {groups.map((group) => (
        <div key={group.section}>
          <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-300/70">
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
                      "flex items-center gap-3 rounded-control px-2.5 py-2 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                      isActive
                        ? "bg-brass/12 font-semibold text-brass"
                        : "text-slate-300 hover:bg-ink-50 hover:text-slate"
                    )
                  }
                >
                  <NavIcon name={item.icon} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

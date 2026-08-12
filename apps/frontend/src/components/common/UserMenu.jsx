import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import Dropdown, { DropdownDivider, DropdownItem, DropdownLabel, DropdownLink } from "../ui/Dropdown.jsx";
import NavIcon from "./NavIcon.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { useAuth } from "../../hooks/useAuth.js";


export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <Dropdown
      width="w-60"
      trigger={(triggerProps, open) => (
        <button
          {...triggerProps}
          type="button"
          aria-label="Account menu"
          className="flex items-center gap-2 rounded-control p-1 pr-2 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Avatar name={user.name || user.email} src={user.avatar_url} size="sm" decorative />
          {!compact && (
            <span className="hidden max-w-[9rem] truncate text-sm text-slate sm:inline">
              {user.name || user.email}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>
      )}
    >
      {({ close }) => (
        <>
          <DropdownLabel>
            <span className="block truncate text-slate">{user.name || "Your account"}</span>
            <span className="block truncate text-xs font-normal text-slate-300">
              {ROLE_LABELS[user.role] || user.email}
            </span>
          </DropdownLabel>
          <DropdownDivider />
          <DropdownLink to="/dashboard" onClick={close} icon={<NavIcon name="grid" className="h-4 w-4" />}>
            Dashboard
          </DropdownLink>
          <DropdownLink to="/profile" onClick={close} icon={<NavIcon name="user" className="h-4 w-4" />}>
            Profile
          </DropdownLink>
          <DropdownLink to="/settings" onClick={close} icon={<NavIcon name="cog" className="h-4 w-4" />}>
            Settings
          </DropdownLink>
          <DropdownDivider />
          <DropdownItem
            danger
            icon={<NavIcon name="logout" className="h-4 w-4" />}
            onClick={() => {
              close();
              handleLogout();
            }}
          >
            Log out
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

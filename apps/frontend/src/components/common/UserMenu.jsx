import { useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import Dropdown, { DropdownDivider, DropdownItem, DropdownLabel, DropdownLink } from "../ui/Dropdown.jsx";
import NavIcon from "./NavIcon.jsx";
import { ROLE_LABELS } from "../../constants/roles.constants.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useTranslation } from "react-i18next";


export default function UserMenu({ compact = false }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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
          aria-label={t("common.accountMenu")}
          className="flex items-center gap-2 rounded-control border border-transparent p-1 pr-2 transition-colors hover:border-border-subtle hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <Avatar name={user.name || user.email} src={user.avatarUrl} size="sm" decorative />
          {!compact && (
            <span className="hidden max-w-[9rem] truncate text-sm text-content-primary sm:inline">
              {user.name || user.email}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-content-muted transition-transform ${open ? "rotate-180" : ""}`}
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
            <span className="block truncate text-content-primary">{user.name || t("common.yourAccount")}</span>
            <span className="block truncate text-xs font-normal text-content-muted">
              {ROLE_LABELS[user.role] || user.email}
            </span>
          </DropdownLabel>
          <DropdownDivider />
          <DropdownLink to="/dashboard" onClick={close} icon={<NavIcon name="grid" className="h-4 w-4" />}>
            {t("navigation.dashboard")}
          </DropdownLink>
          <DropdownLink to="/profile" onClick={close} icon={<NavIcon name="user" className="h-4 w-4" />}>
            {t("navigation.profile")}
          </DropdownLink>
          <DropdownLink to="/settings" onClick={close} icon={<NavIcon name="cog" className="h-4 w-4" />}>
            {t("navigation.settings")}
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
            {t("common.logOut")}
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

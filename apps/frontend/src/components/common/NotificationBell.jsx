import { Link } from "react-router-dom";

import NavIcon from "./NavIcon.jsx";
import { useNotifications } from "../../hooks/useNotifications.js";

export default function NotificationBell({
  to = "/notifications",
}) {
  const { unreadCount } = useNotifications();

  const label =
    unreadCount > 0
      ? `Notifications (${unreadCount} unread)`
      : "Notifications";

  return (
    <Link
      to={to}
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-control text-content-muted transition-colors hover:bg-surface-soft hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <NavIcon
        name="bell"
        className="h-5 w-5"
      />

      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 min-w-[16px] rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground">
          {unreadCount > 9
            ? "9+"
            : unreadCount}
        </span>
      )}
    </Link>
  );
}
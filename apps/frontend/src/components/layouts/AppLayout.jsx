import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../common/Sidebar.jsx";
import NotificationBell from "../common/NotificationBell.jsx";
import UserMenu from "../common/UserMenu.jsx";
import NavIcon from "../common/NavIcon.jsx";
import Button from "../ui/Button.jsx";
import Drawer from "../ui/Drawer.jsx";
import CommandPalette from "../common/CommandPalette.jsx";
import { useAuth } from "../../hooks/useAuth.js";


export default function AppLayout({ children }) {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setNavOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex w-full max-w-[100rem]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-ink-300 bg-ink-900/40 lg:block">
          <Sidebar role={user?.role} showBrand />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-300 bg-ink/90 px-4 backdrop-blur sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className="lg:hidden"
              aria-label="Open navigation"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              <NavIcon name="menu" className="h-5 w-5" />
            </Button>

            <span className="font-display text-base text-slate lg:hidden">NexusWork</span>

            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} title="Navigate" side="left">
        <Sidebar role={user?.role} onNavigate={() => setNavOpen(false)} className="px-0 py-0" />
      </Drawer>

      <CommandPalette />
    </div>
  );
}

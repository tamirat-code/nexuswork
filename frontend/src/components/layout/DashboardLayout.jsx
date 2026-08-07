import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu, Bell, Sun, Moon, LogOut, Settings, UserCircle2, LayoutDashboard,
  Briefcase, Send, FileText, FolderKanban, Wallet, BookOpen, ShieldCheck,
  BarChart3, Users, Scale, Tags, PlusCircle, GraduationCap, PanelLeftClose,
  PanelLeftOpen, Maximize2, Minimize2, Command, ChevronRight, Globe,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../context/NotificationContext";
import CommandPalette from "../dashboard/CommandPalette";

const ROLE_NAV = {
  student: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
    { label: "Find Projects", to: "/projects", icon: Briefcase },
    { label: "My Proposals", to: "/proposals", icon: Send },
    { label: "Contracts", to: "/contracts", icon: FileText },
    { label: "Portfolio", to: "/portfolio", icon: FolderKanban },
    { label: "Wallet", to: "/wallet", icon: Wallet },
    { label: "Learning", to: "/learning", icon: BookOpen },
  ],
  client: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
    { label: "Post a Project", to: "/projects/new", icon: PlusCircle },
    { label: "My Projects", to: "/projects", icon: Briefcase },
    { label: "Proposals", to: "/proposals", icon: Send },
    { label: "Contracts", to: "/contracts", icon: FileText },
    { label: "Wallet", to: "/wallet", icon: Wallet },
  ],
  university_staff: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
    { label: "Verifications", to: "/verifications", icon: ShieldCheck },
    { label: "Analytics", to: "/analytics", icon: BarChart3 },
  ],
  admin: [
    { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
    { label: "Users", to: "/users", icon: Users },
    { label: "Disputes", to: "/disputes", icon: Scale },
    { label: "Categories", to: "/categories", icon: Tags },
    { label: "Reports", to: "/reports", icon: BarChart3 },
    { label: "Settings", to: "/settings", icon: Settings },
  ],
};

const CRUMBS = { dashboard: "Dashboard", projects: "Projects", proposals: "Proposals", contracts: "Contracts", portfolio: "Portfolio", wallet: "Wallet", learning: "Learning", verifications: "Verifications", analytics: "Analytics", users: "Users", disputes: "Disputes", categories: "Categories", reports: "Reports", settings: "Settings" };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { items, toasts, markRead, markAllRead, unread } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nexus_sidebar") === "1");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => localStorage.setItem("nexus_sidebar", collapsed ? "1" : "0"), [collapsed]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); setCollapsed((v) => !v); }
    };
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();

  const nav = ROLE_NAV[user?.role] || ROLE_NAV.student;
  const initials = (user?.name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const crumbs = location.pathname.split("/").filter(Boolean);

  const sidebar = (isCollapsed) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center gap-3 border-b border-slate-200 dark:border-white/10 ${isCollapsed ? "justify-center px-2" : "px-5"}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">NexusWork</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{user?.role}</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard">
        {nav.map((item) => (
          <NavLink
            key={item.to} to={item.to} end={item.to === "/dashboard"}
            onClick={() => setDrawerOpen(false)}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isCollapsed ? "justify-center" : ""} ${
                isActive ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <button
          onClick={() => { logout(); navigate("/login"); }}
          title="Sign out"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-4 w-4" /> {!isCollapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Desktop sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 dark:border-white/10 dark:bg-slate-900/60 lg:block ${collapsed ? "w-20" : "w-64"}`}>
        {sidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 lg:hidden" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
              {sidebar(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <button className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5 lg:flex" onClick={() => setCollapsed((v) => !v)} aria-label="Collapse sidebar" title="Ctrl+B">
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm text-slate-400 md:flex">
            <Link to="/dashboard" className="hover:text-slate-600 dark:hover:text-zinc-200">Home</Link>
            {crumbs.map((c) => (
              <span key={c} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-700 dark:text-zinc-200">{CRUMBS[c] || c}</span>
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Command palette trigger */}
            <button onClick={() => setPaletteOpen(true)} className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-400 hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5 sm:flex" title="Ctrl+K">
              <Command className="h-4 w-4" /> <kbd className="text-[10px]">Ctrl K</kbd>
            </button>

            {/* Language */}
            <label className="relative hidden md:block">
              <span className="sr-only">Language</span>
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-6 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-zinc-300">
                <option value="en">EN</option>
                <option value="am">AM</option>
              </select>
            </label>

            <button onClick={toggleFullscreen} className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5 sm:flex" aria-label="Fullscreen">
              {isFull ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>

            <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification center */}
            <div className="relative">
              <button onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-white/5" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{unread}</span>}
              </button>
              {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                      <button onClick={markAllRead} className="text-xs font-semibold text-blue-600 dark:text-blue-400">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {items.map((n) => (
                        <button key={n.id} onClick={() => markRead(n.id)} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 ${!n.read ? "bg-blue-50/60 dark:bg-blue-500/5" : ""}`}>
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-300 dark:bg-zinc-600" : "bg-blue-500"}`} />
                          <span>
                            <span className="block text-sm text-slate-700 dark:text-zinc-200">{n.message}</span>
                            <span className="text-xs text-slate-400">{n.time}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }} className="flex items-center rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Account">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">{initials}</span>
              </button>
              {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-3 py-2 dark:border-white/5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                    <Link to="/settings" className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-white/5">
                      <UserCircle2 className="h-4 w-4" /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-white/5">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button onClick={() => { logout(); navigate("/login"); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[99] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-slate-900 dark:bg-white dark:text-slate-900"}`}>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
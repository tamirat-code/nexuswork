import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sun, Moon, Maximize2, LogOut, LayoutDashboard, Briefcase, ShieldCheck, Users } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const actions = useMemo(() => [
    { label: "Go to Dashboard", icon: LayoutDashboard, run: () => navigate("/dashboard") },
    { label: "Browse Projects", icon: Briefcase, run: () => navigate("/projects") },
    { label: "Toggle Dark Mode", icon: theme === "dark" ? Sun : Moon, run: toggleTheme },
    { label: "Toggle Fullscreen", icon: Maximize2, run: () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()) },
    { label: "Sign Out", icon: LogOut, run: () => { logout(); navigate("/login"); } },
  ], [theme, navigate, logout, toggleTheme]);

  const filtered = useMemo(() => actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())), [actions, query]);

  useEffect(() => { if (open) { setQuery(""); setIndex(0); setTimeout(() => inputRef.current?.focus(), 40); } }, [open]);
  const run = (a) => { onClose(); a.run(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className="pointer-events-none fixed inset-x-0 top-24 z-[95] flex justify-center px-4">
            <motion.div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900" initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}>
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 dark:border-white/5">
                <Search className="h-4 w-4 text-slate-400" />
                <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }} onKeyDown={(e) => { if (e.key === "ArrowDown") setIndex((i) => Math.min(i + 1, filtered.length - 1)); if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0)); if (e.key === "Enter" && filtered[index]) run(filtered[index]); }} placeholder="Type a command…" className="w-full bg-transparent py-3.5 text-sm outline-none dark:text-white" />
              </div>
              <ul className="max-h-72 overflow-y-auto p-2">
                {filtered.map((a, i) => (
                  <li key={a.label}><button onClick={() => run(a)} onMouseEnter={() => setIndex(i)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${i === index ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" : "text-slate-600 dark:text-zinc-300"}`}><a.icon className="h-4 w-4" /> {a.label}</button></li>
                ))}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Moon, Sun, GraduationCap, Sparkles, ShieldCheck, Wallet, BarChart3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Marketplace", href: "#marketplace" },
  { label: "Universities", href: "#universities" },
  { label: "FAQ", href: "#faq" },
];

const MEGA = [
  { icon: Sparkles, title: "AI Matching", desc: "Projects ranked by real skill fit" },
  { icon: ShieldCheck, title: "Verification", desc: "Registrar-confirmed profiles" },
  { icon: Wallet, title: "Escrow", desc: "Milestone-protected payments" },
  { icon: BarChart3, title: "Analytics", desc: "Outcome dashboards" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <motion.nav
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl border px-4 transition-all duration-300 ${
          scrolled || megaOpen || mobileOpen
            ? "border-slate-200/70 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80"
            : "border-white/10 bg-white/40 backdrop-blur-lg dark:bg-slate-950/40"
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">NexusWork</span>
        </Link>

        {/* Desktop links */}
        <div className="ml-6 hidden items-center gap-1 lg:flex">
          <button
            onClick={() => setMegaOpen((v) => !v)}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-300"
            aria-expanded={megaOpen}
          >
            Platform <ChevronDown className={`h-4 w-4 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
          </button>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="group relative rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-300">
              {l.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language" className="h-9 cursor-pointer rounded-xl border border-slate-200/70 bg-transparent px-1.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-zinc-300">
            <option value="en">EN</option><option value="am">AM</option>
          </select>
          <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-200/50 dark:text-zinc-300 dark:hover:bg-white/10">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/login" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 sm:block dark:text-zinc-200 dark:hover:text-blue-300">Log in</Link>
          <Link to="/register" className="hidden rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 sm:block">Get started</Link>

          {/* Animated hamburger */}
          <button onClick={() => setMobileOpen((v) => !v)} aria-label="Menu" aria-expanded={mobileOpen} className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-xl lg:hidden">
            <span className={`h-0.5 w-5 rounded-full bg-slate-800 transition-all duration-300 dark:bg-white ${mobileOpen ? "translate-y-1 rotate-45" : ""}`} />
            <span className={`h-0.5 w-5 rounded-full bg-slate-800 transition-all duration-300 dark:bg-white ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mega menu */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute inset-x-0 top-16 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/70 bg-white/90 p-3 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90">
              {MEGA.map((m) => (
                <a key={m.title} href="#features" onClick={() => setMegaOpen(false)} className="flex items-start gap-3 rounded-xl p-3 hover:bg-blue-500/10">
                  <m.icon className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span><span className="block text-sm font-bold text-slate-900 dark:text-white">{m.title}</span><span className="text-xs text-slate-500 dark:text-zinc-400">{m.desc}</span></span>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-6xl rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-2xl backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-slate-950/90">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-500/10 dark:text-zinc-200">{l.label}</a>
            ))}
            <div className="mt-3 flex gap-2 border-t border-slate-200/70 pt-3 dark:border-white/10">
              <Link to="/login" className="flex-1 rounded-xl border border-slate-300 py-2.5 text-center text-sm font-bold dark:border-white/15 dark:text-zinc-200">Log in</Link>
              <Link to="/register" className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 py-2.5 text-center text-sm font-bold text-white">Get started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
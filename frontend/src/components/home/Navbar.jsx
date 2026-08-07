import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Globe, Menu, Moon, Sun, X } from "lucide-react";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: t("nav.home"), href: "#top" },
    { label: t("nav.explore"), href: "#featured-projects" },
    { label: t("nav.talent"), href: "#top-freelancers" },
    { label: t("nav.universities"), href: "#university-partnership" },
    { label: t("nav.about"), href: "#how-it-works" },
    { label: t("nav.contact"), href: "#footer" },
  ];

  const linkClasses =
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-primary dark:text-slate-300 dark:hover:text-blue-300";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
        scrolled
          ? "border-b border-slate-200/70 bg-white/85 shadow-soft backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/85"
          : "bg-transparent"
      }`}
    >
      <Container>
        <nav
          aria-label="Main navigation"
          className="flex h-20 items-center justify-between gap-4"
        >
          <Link to="/" className="flex items-center gap-3">
  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
    <GraduationCap className="h-6 w-6" aria-hidden="true" />
  </span>
  <span className="hidden text-left xl:block">
    <span className="block text-sm font-extrabold leading-4 text-slate-900 dark:text-white">
      NexusWork
    </span>
    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
      Student Talent Network
    </span>
  </span>
</Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className={linkClasses}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="relative hidden md:block">
              <span className="sr-only">Select language</span>
              <Globe
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="en">EN</option>
                <option value="am">AM</option>
              </select>
            </label>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <div className="hidden lg:flex">
              <Button to="/login" variant="ghost" size="sm">
                {t("nav.login")}
              </Button>
              <Button to="/register" variant="primary" size="sm">
                {t("nav.register")}
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </Container>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden"
          >
            <Container className="py-6">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <label className="relative block md:hidden">
                  <span className="sr-only">Select language</span>
                  <Globe
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="am">Amharic</option>
                  </select>
                </label>

                <Button to="/login" variant="secondary" className="w-full">
                  {t("nav.login")}
                </Button>
                <Button to="/register" variant="primary" className="w-full">
                  {t("nav.register")}
                </Button>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
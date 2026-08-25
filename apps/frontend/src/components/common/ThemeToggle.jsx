import { useTheme } from "../../app/providers/ThemeProvider.jsx";
import { cn } from "../../lib/cn.js";

/**
 * Accessible theme-toggle icon button.
 * Drops in alongside NotificationBell in the header icon group.
 * No layout changes — pure visual swap of sun / moon.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-control",
        "text-slate-300 transition-colors duration-150",
        "hover:bg-ink-50 hover:text-slate",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        className
      )}
    >
      {/* Sun icon — visible in dark mode; clicking switches to light */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cn(
          "absolute h-5 w-5 transition-all duration-200",
          isDark ? "rotate-0 opacity-100 scale-100" : "rotate-90 opacity-0 scale-75"
        )}
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon icon — visible in light mode; clicking switches to dark */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cn(
          "absolute h-5 w-5 transition-all duration-200",
          isDark ? "-rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
        )}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

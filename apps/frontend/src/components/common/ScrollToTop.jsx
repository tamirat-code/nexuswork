import { useEffect } from "react";
import { useLocation } from "react-router-dom";


export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

/** Keyboard users' first stop: jumps past the shell chrome into page content. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-control focus:bg-brass focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
    >
      Skip to content
    </a>
  );
}

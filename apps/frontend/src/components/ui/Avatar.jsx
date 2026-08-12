
import { cn } from "../../lib/cn.js";

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
};

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}


export default function Avatar({
  name = "",
  src,
  size = "md",
  verified = false,
  decorative = false,
  className = "",
}) {
  const tickSize = size === "xl" ? "h-6 w-6" : size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={decorative ? "" : `${name} profile photo`}
          loading="lazy"
          className={cn("rounded-full border border-ink-300 object-cover", sizes[size])}
        />
      ) : (
        <span
          aria-hidden={decorative || undefined}
          className={cn(
            "grid place-items-center rounded-full border border-ink-300 bg-ink-700 font-semibold text-brass",
            sizes[size]
          )}
        >
          {initials(name)}
        </span>
      )}

      {verified && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full border-2 border-ink bg-brass text-ink",
            tickSize
          )}
          title="University verified"
        >
          <span className="sr-only">University verified</span>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-2/3 w-2/3" aria-hidden="true">
            <path d="m2.5 6.2 2.3 2.3 4.7-5.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </span>
  );
}

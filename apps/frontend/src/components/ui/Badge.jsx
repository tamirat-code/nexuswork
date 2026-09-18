import { cn } from "../../lib/cn.js";

/**
 * Semantic badge tones — maps to correct colors in both light and dark themes.
 * The CSS in globals.css provides light-mode overrides for the escrow/brick/amber/info classes.
 */
const tones = {
  neutral: "border-border-subtle bg-surface-soft text-content-secondary",
  brand:   "border-brand/30 bg-brand-soft text-brand",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger:  "border-danger/30 bg-danger-soft text-danger",
  info:    "border-info/30 bg-info-100 text-info",
  purple:  "border-purple/30 bg-purple/10 text-purple",
};

const sizes = {
  sm: "h-5 px-1.5 text-[10px] gap-1",
  md: "h-6 px-2 text-[11px] gap-1.5",
};


export default function Badge({ tone = "neutral", size = "md", icon, className = "", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-semibold uppercase tracking-wide",
        tones[tone] || tones.neutral,
        sizes[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

export { tones as badgeTones };

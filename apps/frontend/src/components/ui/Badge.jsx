import { cn } from "../../lib/cn.js";

const tones = {
  neutral: "border-ink-300 bg-ink text-slate-300",
  brand: "border-brass/30 bg-brass/10 text-brass",
  success: "border-escrow/30 bg-escrow-100 text-escrow",
  warning: "border-amber/30 bg-amber-100 text-amber",
  danger: "border-brick/30 bg-brick-100 text-brick",
  info: "border-info/30 bg-info-100 text-info",
};

const sizes = {
  sm: "h-5 px-2 text-[11px]",
  md: "h-6 px-2.5 text-xs",
};


export default function Badge({ tone = "neutral", size = "md", icon, className = "", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
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

import { cn } from "../../lib/cn.js";

const tones = {
  brand: "bg-brass",
  success: "bg-escrow",
  warning: "bg-amber",
  danger: "bg-brick",
  info: "bg-info",
};


export default function ProgressBar({
  value = 0,
  max = 100,
  tone = "brand",
  label,
  valueText,
  showValue = false,
  size = "md",
  className = "",
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-xs font-medium text-slate-300">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-slate tabular-nums">{valueText ?? `${Math.round(pct)}%`}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? undefined : "Progress"}
        aria-valuetext={valueText}
        className={cn("w-full overflow-hidden rounded-full bg-ink-50", size === "sm" ? "h-1" : "h-2")}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", tones[tone] || tones.brand)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Segmented variant used for milestone timelines: N of M steps complete. */
export function StepProgress({ steps = 0, completed = 0, tone = "brand", className = "" }) {
  return (
    <div
      className={cn("flex gap-1", className)}
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={steps}
      aria-valuetext={`${completed} of ${steps} milestones complete`}
    >
      {Array.from({ length: steps }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 flex-1 rounded-full transition-colors", i < completed ? tones[tone] : "bg-ink-50")}
        />
      ))}
    </div>
  );
}

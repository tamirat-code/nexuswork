import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold text-sm " +
  "transition-all duration-150 select-none shrink-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

const variants = {
  primary:
    "bg-brass text-ink hover:bg-brass-300 active:bg-brass-700 shadow-[0_1px_3px_-1px_rgba(0,137,123,0.3)]",
  secondary:
    "border border-ink-300 bg-ink-50 text-slate hover:border-brass/40 hover:bg-ink-700 active:bg-ink",
  outline:
    "border-2 border-brass/50 text-brass hover:bg-brass/10 active:bg-brass/15",
  ghost:
    "text-slate-300 hover:bg-ink-50 hover:text-slate active:bg-ink-700",
  danger:
    "bg-brick text-white hover:bg-brick/90 active:bg-brick/80",
  "danger-ghost":
    "text-brick hover:bg-brick-100/60 active:bg-brick-100",
  success:
    "bg-escrow text-ink-900 hover:bg-escrow/90 active:bg-escrow/80 shadow-[0_1px_3px_-1px_rgba(34,197,94,0.3)]",
  link:
    "h-auto p-0 font-semibold text-brass underline-offset-4 hover:underline",
};

const sizes = {
  xs: "h-8 px-3 text-xs",
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm font-semibold",
  lg: "h-11 px-6 text-[15px] font-bold",
};

/** Square sizes so icon-only buttons keep a comfortable tap target on mobile. */
const iconSizes = {
  xs: "h-8 w-8 p-0",
  sm: "h-9 w-9 p-0",
  md: "h-10 w-10 p-0",
  lg: "h-11 w-11 p-0",
};

function ButtonSpinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

/**
 * The single button implementation for NexusWork.
 * All variants, sizes, loading state, icon-only mode.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    iconOnly = false,
    fullWidth = false,
    type = "button",
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const sizeClass = variant === "link" ? "" : iconOnly ? iconSizes[size] : sizes[size];

  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizeClass, fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <ButtonSpinner />}
      {loading && iconOnly ? null : children}
    </button>
  );
});

export default Button;

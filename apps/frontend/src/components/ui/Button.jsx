const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold tracking-tight " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "select-none active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0";

const variants = {
  primary: "bg-brass text-ink shadow-card hover:bg-brass-300 active:bg-brass-700 active:text-ink",
  secondary: "border border-ink-300 bg-ink-50 text-slate hover:border-brass hover:text-white",
  ghost: "text-slate-300 hover:bg-ink-50 hover:text-slate",
  danger: "bg-brick text-ink hover:opacity-90",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
    </svg>
  );
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

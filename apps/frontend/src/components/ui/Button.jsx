const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-ink text-white hover:bg-ink-700 active:bg-ink-900",
  secondary: "border border-ink-100 text-ink hover:bg-ink-50",
  ghost: "text-ink hover:bg-ink-50",
  danger: "bg-brick text-white hover:opacity-90",
};

const sizes = {
  sm: "h-9 px-3",
  md: "h-11 px-5",
  lg: "h-12 px-6 text-base",
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
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
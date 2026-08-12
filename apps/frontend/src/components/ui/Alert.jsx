import { cn } from "../../lib/cn.js";

const variants = {
  info: { wrap: "border-info/30 bg-info-100", icon: "text-info", path: "M8 5v4m0 3h.01" },
  success: { wrap: "border-escrow/30 bg-escrow-100", icon: "text-escrow", path: "m4.5 8.4 2.4 2.4 4.6-5.2" },
  warning: { wrap: "border-amber/30 bg-amber-100", icon: "text-amber", path: "M8 5v4m0 3h.01" },
  danger: { wrap: "border-brick/30 bg-brick-100", icon: "text-brick", path: "M8 5v4m0 3h.01" },
};


export default function Alert({ variant = "info", title, children, actions, live = false, className = "" }) {
  const style = variants[variant] || variants.info;

  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      aria-live={live ? (variant === "danger" ? "assertive" : "polite") : undefined}
      className={cn("flex gap-3 rounded-card border p-4", style.wrap, className)}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
        className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)}
      >
        {variant === "success" ? (
          <path d={style.path} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <circle cx="8" cy="8" r="6.5" />
            <path d={style.path} strokeLinecap="round" />
          </>
        )}
      </svg>

      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-slate">{title}</p>}
        {children && (
          <div className={cn("text-sm leading-relaxed text-slate-300", title && "mt-1")}>{children}</div>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

import { cn } from "../../lib/cn.js";

const variants = {
  info: { wrap: "border-info/30 bg-info-soft", icon: "text-info", path: "M8 5v4m0 3h.01" },
  success: { wrap: "border-success/30 bg-success-soft", icon: "text-success", path: "m4.5 8.4 2.4 2.4 4.6-5.2" },
  warning: { wrap: "border-warning/30 bg-warning-soft", icon: "text-warning", path: "M8 5v4m0 3h.01" },
  danger: { wrap: "border-danger/30 bg-danger-soft", icon: "text-danger", path: "M8 5v4m0 3h.01" },
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
        {title && <p className="text-sm font-semibold text-content-primary">{title}</p>}
        {children && (
          <div className={cn("text-sm leading-relaxed text-content-secondary", title && "mt-1")}>{children}</div>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

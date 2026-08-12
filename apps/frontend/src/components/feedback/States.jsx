import Button from "../ui/Button.jsx";
import { cn } from "../../lib/cn.js";


export function EmptyState({ icon, title, description, action, secondaryAction, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-ink-300 bg-ink-700/40 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-ink-300 bg-ink text-brass">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg text-slate">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this",
  description = "Something went wrong on our side. Try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-brick/25 bg-brick-100/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-brick/30 bg-brick-100 text-brick">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-5 w-5">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 3.5h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="font-display text-lg text-slate">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…", className = "" }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center py-14", className)}>
      <svg className="h-6 w-6 animate-spin text-brass" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
      </svg>
      <p className="mt-3 text-sm text-slate-300">{label}</p>
    </div>
  );
}

export default EmptyState;

import { isValidElement } from "react";
import Button from "../ui/Button.jsx";
import { cn } from "../../lib/cn.js";
import { Inbox } from "lucide-react";

function renderIcon(Icon, className = "h-6 w-6") {
  if (!Icon) return null;
  if (isValidElement(Icon)) return Icon;
  const Component = Icon;
  return <Component className={className} />;
}

/**
 * EmptyState — Designed empty state component.
 * Uses crisp surface background, prominent icon badge (bg-brand-soft text-brand),
 * concise heading, and clear primary CTA button. Never a gray disabled rectangle!
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "No activity yet",
  description = "Items will appear here as soon as there's something to show.",
  action,
  secondaryAction,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-border bg-surface px-6 py-12 text-center shadow-card",
        className
      )}
    >
      <div className="mb-3.5 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand shadow-subtle">
        {renderIcon(Icon, "h-6 w-6")}
      </div>

      <h3 className="font-display text-base font-bold tracking-tight text-content-primary">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-content-secondary">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this data",
  description = "Something went wrong while communicating with our servers. Try refreshing in a moment.",
  onRetry,
  retryLabel = "Try again",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-danger/20 bg-surface px-6 py-10 text-center shadow-card",
        className
      )}
    >
      <div className="mb-3.5 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" className="h-6 w-6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 3.5h.01" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="font-display text-base font-bold tracking-tight text-content-primary">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-content-secondary">
        {description}
      </p>

      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading dashboard…", className = "" }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center py-12", className)}>
      <svg className="h-6 w-6 animate-spin text-brand" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
      </svg>
      <p className="mt-3 text-xs font-medium text-content-muted">{label}</p>
    </div>
  );
}

export default EmptyState;

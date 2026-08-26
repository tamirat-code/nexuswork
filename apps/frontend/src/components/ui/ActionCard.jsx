import { isValidElement } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/cn.js";

function renderIcon(Icon, className = "h-5 w-5") {
  if (!Icon) return null;
  if (isValidElement(Icon)) return Icon;
  const Component = Icon;
  return <Component className={className} />;
}

/**
 * ActionCard — Interactive action cards for workspace navigation and quick actions.
 * Crisp white surface in Light Mode, soft elevation, brand teal icon indicator,
 * clean hover lift — never a gray disabled box!
 */
export default function ActionCard({
  to,
  onClick,
  title,
  description,
  icon: Icon,
  badge,
  className = "",
}) {
  const content = (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-card border border-border bg-surface p-4 sm:p-5 shadow-card transition-all duration-200",
        "hover:border-brand/40 hover:shadow-elevated hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
    >
      {Icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
          {renderIcon(Icon, "h-5 w-5")}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold tracking-tight text-content-primary group-hover:text-brand transition-colors">
            {title}
          </h3>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-content-secondary">
            {description}
          </p>
        )}
      </div>

      <div className="mt-0.5 shrink-0 text-content-muted transition-transform group-hover:translate-x-1 group-hover:text-brand">
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left no-underline">
      {content}
    </button>
  );
}

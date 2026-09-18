import { cn } from "../../lib/cn.js";


/**
 * Reusable card system.
 *
 * Variants:
 *   default    — standard surface card with a subtle border
 *   elevated   — float above canvas with stronger shadow
 *   interactive — hover lift + teal border accent
 *   featured   — premium featured surface
 *   metric     — compact stat card with no padding override
 */
export default function Card({
  as: Tag = "div",
  padded = true,
  interactive = false,
  elevated = false,
  featured = false,
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "rounded-[18px] border border-border-subtle bg-surface/90",
        featured
          ? "surface-featured"
          : elevated
          ? "shadow-elevated"
          : "shadow-card",
        padded && "p-5 sm:p-6",
        interactive &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Title row with optional description and right-aligned actions. */
export function CardHeader({ title, description, actions, className = "", titleAs: TitleTag = "h2" }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <TitleTag className="font-display text-base font-semibold leading-snug text-content-primary">
          {title}
        </TitleTag>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-content-secondary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Hairline separator that matches the card border. */
export function CardDivider({ className = "" }) {
  return <div className={cn("h-px bg-border-subtle", className)} role="presentation" />;
}

/** Muted footer strip for secondary actions or metadata. */
export function CardFooter({ className = "", children }) {
  return (
    <div className={cn("mt-4 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4", className)}>
      {children}
    </div>
  );
}

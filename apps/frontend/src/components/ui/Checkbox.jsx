import { forwardRef, useId } from "react";
import { cn } from "../../lib/cn.js";


const Checkbox = forwardRef(function Checkbox(
  { label, description, error, id: idProp, className = "", ...props },
  ref
) {
  const reactId = useId();
  const id = idProp || reactId;
  const errorId = error ? `${id}-error` : undefined;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="peer sr-only"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId || descId}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 cursor-pointer place-items-center rounded-[6px] border bg-ink-50 transition-colors",
            "peer-checked:border-brass peer-checked:bg-brass peer-checked:text-ink",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brass peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
            error ? "border-brick" : "border-ink-300 hover:border-brass/50"
          )}
        >
          <svg
            className="h-3 w-3 opacity-0 transition-opacity peer-checked:opacity-100"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m2.5 6.5 2.5 2.5 4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>

        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label htmlFor={id} className="cursor-pointer text-sm font-medium text-slate">
                {label}
              </label>
            )}
            {description && (
              <p id={descId} className="mt-0.5 text-xs leading-relaxed text-slate-300">
                {description}
              </p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-brick">
          {error}
        </p>
      )}
    </div>
  );
});

export default Checkbox;

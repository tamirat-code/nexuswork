import { cn } from "../../lib/cn.js";


export default function Field({
  label,
  htmlFor,
  required = false,
  optional = false,
  hint,
  error,
  hintId,
  errorId,
  labelSuffix,
  className = "",
  children,
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={htmlFor} className="block text-sm font-medium text-slate">
            {label}
            {required && (
              <span className="ml-1 text-brass" aria-hidden="true">
                *
              </span>
            )}
            {required && <span className="sr-only"> (required)</span>}
            {optional && !required && (
              <span className="ml-2 text-xs font-normal text-slate-300">Optional</span>
            )}
          </label>
          {labelSuffix}
        </div>
      )}

      {children}

      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-brick">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 3.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75Zm0 6.5a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
          </svg>
          <span>{error}</span>
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs leading-relaxed text-slate-300">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/**
 * Shared control chrome for every input, textarea, and select.
 * Height: h-10 — compact but comfortable.
 * Focus: teal ring (adapts to both themes via globals.css).
 */
export const controlClass = (error, className = "") =>
  cn(
    "w-full rounded-control border bg-ink-50 px-3.5 text-sm font-medium text-slate h-10",
    "placeholder:text-slate-300 transition-colors duration-150",
    "focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass/60",
    "disabled:cursor-not-allowed disabled:opacity-50",
    error ? "border-brick" : "border-ink-300 hover:border-brass/40",
    className
  );

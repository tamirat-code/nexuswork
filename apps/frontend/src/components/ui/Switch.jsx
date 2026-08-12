import { useId } from "react";
import { cn } from "../../lib/cn.js";


export default function Switch({ label, description, checked = false, onChange, disabled, id: idProp, className = "" }) {
  const reactId = useId();
  const id = idProp || reactId;
  const descId = description ? `${id}-desc` : undefined;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
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

      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-describedby={descId}
        aria-label={label ? undefined : "Toggle"}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          "disabled:cursor-not-allowed disabled:opacity-45",
          checked ? "border-brass bg-brass" : "border-ink-300 bg-ink-50"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full transition-transform duration-150",
            checked ? "translate-x-6 bg-ink" : "translate-x-1 bg-slate-300"
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

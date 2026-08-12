import { useId } from "react";
import { cn } from "../../lib/cn.js";


export default function RadioGroup({
  label,
  name,
  value,
  onChange,
  options = [],
  hint,
  error,
  columns = 1,
  className = "",
}) {
  const groupId = useId();
  const describedBy = error ? `${groupId}-error` : hint ? `${groupId}-hint` : undefined;

  return (
    <fieldset className={cn("space-y-2", className)} aria-describedby={describedBy}>
      {label && <legend className="mb-2 text-sm font-medium text-slate">{label}</legend>}

      <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
        {options.map((opt) => {
          const id = `${groupId}-${opt.value}`;
          const selected = value === opt.value;

          return (
            <div key={opt.value}>
              <input
                type="radio"
                id={id}
                name={name}
                value={opt.value}
                checked={selected}
                disabled={opt.disabled}
                onChange={() => onChange?.(opt.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  "flex h-full cursor-pointer gap-3 rounded-control border p-3.5 transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-brass peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink",
                  "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
                  selected
                    ? "border-brass/60 bg-brass/10"
                    : "border-ink-300 bg-ink-50 hover:border-brass/30 hover:bg-ink-700"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                    selected ? "border-brass" : "border-slate-300"
                  )}
                  aria-hidden="true"
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-brass" />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", selected ? "text-brass" : "text-slate")}>
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-300">{opt.description}</span>
                  )}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      {error ? (
        <p id={`${groupId}-error`} className="text-sm text-brick">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${groupId}-hint`} className="text-xs text-slate-300">
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

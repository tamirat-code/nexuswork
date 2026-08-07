import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FloatingInput({
  id,
  label,
  type = "text",
  icon: Icon,
  value,
  onChange,
  onBlur,
  error,
  showSuccess,
  autoComplete,
  autoFocus,
  trailing,
  disabled,
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || (value && value.length > 0);
  const leftClass = Icon ? "left-11" : "left-4";

  return (
    <div>
      <div
        className={`relative rounded-xl border-2 transition-all duration-200 bg-white/70 backdrop-blur dark:bg-white/[0.04] ${
          error
            ? "border-red-500/70"
            : focused
            ? "border-blue-500 ring-4 ring-blue-500/10"
            : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
        }`}
      >
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
              focused ? "text-blue-500" : error ? "text-red-400" : "text-slate-400 dark:text-zinc-500"
            }`}
            aria-hidden="true"
          />
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          placeholder=" "
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full bg-transparent text-sm text-slate-900 outline-none dark:text-white ${
            Icon ? "pl-11" : "pl-4"
          } ${trailing ? "pr-12" : "pr-4"} ${
            showSuccess && !error ? "pr-10" : ""
          } ${floated ? "pt-6 pb-1.5" : "pt-3.5 pb-3.5"}`}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute ${leftClass} transition-all duration-150 ${
            floated
              ? "top-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500"
              : "top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-zinc-500"
          } ${focused && !floated ? "text-blue-500" : ""}`}
        >
          {label}
        </label>

        {trailing}

        {showSuccess && !error && (
          <CheckCircle2
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500"
            aria-hidden="true"
          />
        )}
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
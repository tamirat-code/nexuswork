import { useId } from "react";

export default function Input({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold tracking-tight text-slate">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-11 w-full rounded-control border bg-ink-100 px-3.5 text-sm text-white
          placeholder:text-slate-300/70 transition-colors duration-150
          ${error ? "border-brick focus:border-brick" : "border-ink-300 hover:border-slate-300 focus:border-brass"}
          ${className}`}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId || hintId}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-[13px] text-brick" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs leading-relaxed text-slate-300">
          {hint}
        </p>
      )}
    </div>
  );
}

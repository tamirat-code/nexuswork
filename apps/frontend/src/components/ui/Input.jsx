import { useId } from "react";

export default function Input({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full h-11 rounded-control border px-3.5 text-sm text-slate placeholder:text-slate-300
          transition-colors duration-150 bg-ink-50
          ${error ? "border-brick" : "border-ink-300 hover:border-brass"}
          ${className}`}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId || hintId}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-brick" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-xs text-slate-300">
          {hint}
        </p>
      )}
    </div>
  );
}
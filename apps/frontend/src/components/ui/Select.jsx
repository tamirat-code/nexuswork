import { forwardRef, useId } from "react";
import Field, { controlClass } from "./Field.jsx";
import { cn } from "../../lib/cn.js";


const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required,
    optional,
    options = [],
    placeholder,
    id: idProp,
    className = "",
    wrapperClassName = "",
    children,
    ...props
  },
  ref
) {
  const reactId = useId();
  const id = idProp || reactId;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <Field
      label={label}
      htmlFor={id}
      required={required}
      optional={optional}
      hint={hint}
      error={error}
      hintId={hintId}
      errorId={errorId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={controlClass(error, cn("h-11 appearance-none pr-10", className))}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId || hintId}
          aria-required={required || undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path d="m4 6.5 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Field>
  );
});

export default Select;

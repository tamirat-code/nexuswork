import { forwardRef, useId } from "react";
import Field, { controlClass } from "./Field.jsx";
import { cn } from "../../lib/cn.js";


const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required,
    optional,
    labelSuffix,
    leadingIcon,
    trailingSlot,
    id: idProp,
    className = "",
    wrapperClassName = "",
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
      labelSuffix={labelSuffix}
      className={wrapperClassName}
    >
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={controlClass(
            error,
            cn("h-11", leadingIcon && "pl-10", trailingSlot && "pr-11", className)
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId || hintId}
          aria-required={required || undefined}
          {...props}
        />
        {trailingSlot && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailingSlot}</span>
        )}
      </div>
    </Field>
  );
});

export default Input;

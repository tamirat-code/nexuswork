import { forwardRef, useId } from "react";
import Field, { controlClass } from "./Field.jsx";
import { cn } from "../../lib/cn.js";


const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    hint,
    required,
    optional,
    rows = 5,
    maxLength,
    showCount = false,
    value,
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
  const length = typeof value === "string" ? value.length : 0;

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
      labelSuffix={
        showCount && maxLength ? (
          <span
            className={cn("text-xs tabular-nums", length > maxLength * 0.9 ? "text-amber" : "text-slate-300")}
          >
            {length}/{maxLength}
          </span>
        ) : null
      }
    >
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        className={controlClass(error, cn("resize-y py-2.5 leading-relaxed", className))}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={errorId || hintId}
        aria-required={required || undefined}
        {...props}
      />
    </Field>
  );
});

export default Textarea;

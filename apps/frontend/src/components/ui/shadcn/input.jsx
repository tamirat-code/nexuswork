import * as React from "react";
import { cn } from "../../../lib/cn.js";

const Input = React.forwardRef(function Input({ className, type, ...props }, ref) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-control border border-ink-300 bg-ink-100 px-3 py-2 text-sm text-slate placeholder:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-45 file:border-0 file:bg-transparent file:text-sm file:font-semibold",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

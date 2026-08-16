import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../../lib/cn.js";

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-sm font-semibold text-slate", className)}
      {...props}
    />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };

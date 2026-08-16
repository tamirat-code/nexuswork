import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../../lib/cn.js";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brass text-ink",
        secondary: "border-ink-300 bg-ink-50 text-slate",
        outline: "border-brass/40 text-brass",
        success: "border-transparent bg-escrow-100 text-escrow",
        warning: "border-transparent bg-amber-100 text-amber-500",
        danger: "border-transparent bg-brick-100 text-brick",
        info: "border-transparent bg-blue-100 text-blue-400",
        neutral: "border-ink-300 bg-ink-100 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

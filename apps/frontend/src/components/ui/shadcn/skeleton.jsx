import { cn } from "../../../lib/cn.js";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-shimmer rounded-control bg-gradient-to-r from-ink-50 via-ink-300 to-ink-50 bg-[length:200%_100%]", className)}
      {...props}
    />
  );
}

export { Skeleton };

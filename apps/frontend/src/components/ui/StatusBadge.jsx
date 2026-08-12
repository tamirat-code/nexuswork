import Badge from "./Badge.jsx";
import { getStatusMeta } from "../../constants/status.constants.js";

/** Dot shapes differ per tone so status is legible without relying on colour. */
const DOTS = {
  success: "rounded-full",
  info: "rounded-full",
  warning: "rounded-[1px] rotate-45",
  danger: "rounded-[1px]",
  neutral: "rounded-full",
  brand: "rounded-full",
};


export default function StatusBadge({ kind, status, size = "md", showDot = true, className = "" }) {
  const meta = getStatusMeta(kind, status);

  return (
    <Badge
      tone={meta.tone}
      size={size}
      className={className}
      title={meta.hint || undefined}
      icon={
        showDot ? (
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 shrink-0 bg-current ${DOTS[meta.tone] || DOTS.neutral}`}
          />
        ) : null
      }
    >
      {meta.label}
    </Badge>
  );
}

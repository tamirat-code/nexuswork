import { Badge } from "../components/ui/shadcn/badge.jsx";
import { getStatusMeta } from "../constants/status.constants.js";


const TONE_TO_VARIANT = {
  success: "success",
  info: "info",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
  brand: "default",
};


export function renderStatusBadge({ kind, status, className = "", showDot = true }) {
  const meta = getStatusMeta(kind, status);
  const variant = TONE_TO_VARIANT[meta.tone] || "neutral";

  return (
    <Badge variant={variant} className={className} title={meta.hint || undefined}>
      {showDot && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {meta.label}
    </Badge>
  );
}


export function StatusBadge({ kind, status, className, showDot }) {
  return renderStatusBadge({ kind, status, className, showDot });
}
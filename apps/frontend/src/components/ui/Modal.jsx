import { useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button.jsx";
import { useFocusTrap, useLockBodyScroll } from "../../hooks/useFocusTrap.js";
import { cn } from "../../lib/cn.js";

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};


export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  footer,
  dismissible = true,
  children,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  const handleClose = useCallback(() => {
    if (dismissible) onClose?.();
  }, [dismissible, onClose]);

  useFocusTrap(panelRef, open, { onEscape: handleClose });
  useLockBodyScroll(open);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-ink-300 bg-ink-700 shadow-elevated",
              "rounded-t-card sm:rounded-card",
              widths[size]
            )}
          >
            {(title || dismissible) && (
              <div className="flex items-start justify-between gap-4 border-b border-ink-300 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="font-display text-lg leading-tight text-slate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descId} className="mt-1 text-sm leading-relaxed text-slate-300">
                      {description}
                    </p>
                  )}
                </div>
                {dismissible && (
                  <Button variant="ghost" size="sm" iconOnly aria-label="Close dialog" onClick={handleClose}>
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                    </svg>
                  </Button>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-ink-300 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

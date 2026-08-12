import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button.jsx";
import { useFocusTrap, useLockBodyScroll } from "../../hooks/useFocusTrap.js";
import { cn } from "../../lib/cn.js";


export default function Drawer({ open, onClose, title, side = "right", children, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useFocusTrap(panelRef, open, { onEscape: onClose });
  useLockBodyScroll(open);

  if (typeof document === "undefined") return null;

  const isBottom = side === "bottom";
  const offscreen = isBottom ? { y: "100%" } : { x: side === "left" ? "-100%" : "100%" };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={offscreen}
            animate={{ x: 0, y: 0 }}
            exit={offscreen}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className={cn(
              "absolute flex flex-col border-ink-300 bg-ink-700 shadow-elevated",
              isBottom
                ? "inset-x-0 bottom-0 max-h-[85vh] rounded-t-card border-t"
                : cn(
                    "top-0 h-full w-[min(92vw,26rem)]",
                    side === "left" ? "left-0 border-r" : "right-0 border-l"
                  )
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-ink-300 px-5 py-4">
              <h2 id={titleId} className="font-display text-lg text-slate">
                {title}
              </h2>
              <Button variant="ghost" size="sm" iconOnly aria-label="Close panel" onClick={onClose}>
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

            {footer && <div className="flex gap-2 border-t border-ink-300 px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

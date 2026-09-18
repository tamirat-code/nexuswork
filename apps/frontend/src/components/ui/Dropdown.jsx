import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMenu } from "../../hooks/useMenu.js";
import { cn } from "../../lib/cn.js";


export default function Dropdown({ trigger, align = "right", width = "w-56", className = "", children }) {
  const menu = useMenu();

  return (
    <div className={cn("relative", className)}>
      {trigger(menu.triggerProps, menu.open)}

      <AnimatePresence>
        {menu.open && (
          <motion.div
            {...menu.menuProps}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute z-40 mt-2 overflow-hidden rounded-card border border-border-subtle bg-surface/95 py-1.5 shadow-elevated backdrop-blur-xl",
              align === "right" ? "right-0" : "left-0",
              width
            )}
          >
            {typeof children === "function" ? children({ close: menu.close }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemClass = (danger) =>
  cn(
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors",
    "focus:outline-none focus-visible:bg-surface-soft",
    danger ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft" : "text-content-secondary hover:bg-surface-soft hover:text-content-primary"
  );

/** Menu item that navigates. */
export function DropdownLink({ to, icon, children, onClick, danger = false }) {
  return (
    <Link to={to} role="menuitem" data-menu-item tabIndex={-1} onClick={onClick} className={itemClass(danger)}>
      {icon && <span className="shrink-0 text-content-muted">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Link>
  );
}

/** Menu item that performs an action. */
export function DropdownItem({ onClick, icon, children, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      data-menu-item
      tabIndex={-1}
      disabled={disabled}
      onClick={onClick}
      className={cn(itemClass(danger), disabled && "cursor-not-allowed opacity-45")}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1.5 h-px bg-border-subtle" role="separator" />;
}

export function DropdownLabel({ children }) {
  return (
    <p className="px-3.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-widest text-content-muted">
      {children}
    </p>
  );
}

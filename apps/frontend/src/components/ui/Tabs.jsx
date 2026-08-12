import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/cn.js";


export default function Tabs({ items = [], value, onChange, className = "", ariaLabel = "Sections" }) {
  const listRef = useRef(null);

  function handleKeyDown(event) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const enabled = items.filter((i) => !i.disabled);
    const index = enabled.findIndex((i) => i.value === value);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
    if (event.key === "ArrowLeft") next = (index - 1 + enabled.length) % enabled.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = enabled.length - 1;

    const target = enabled[next];
    if (target) {
      onChange?.(target.value);
      listRef.current?.querySelector(`[data-tab="${target.value}"]`)?.focus();
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn("-mx-1 flex gap-1 overflow-x-auto border-b border-ink-300 px-1", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-tab={item.value}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange?.(item.value)}
            className={cn(
              "relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              "disabled:cursor-not-allowed disabled:opacity-45",
              active ? "text-brass" : "text-slate-300 hover:text-slate"
            )}
          >
            <span className="flex items-center gap-2">
              {item.label}
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-brass/15 text-brass" : "bg-ink-50 text-slate-300"
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brass" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

/** Same strip, but each tab is a route. Use when tabs should be shareable URLs. */
export function LinkTabs({ items = [], className = "", ariaLabel = "Sections" }) {
  return (
    <nav aria-label={ariaLabel} className={cn("-mx-1 flex gap-1 overflow-x-auto border-b border-ink-300 px-1", className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              isActive ? "text-brass" : "text-slate-300 hover:text-slate"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-2">
                {item.label}
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      isActive ? "bg-brass/15 text-brass" : "bg-ink-50 text-slate-300"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </span>
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brass" aria-hidden="true" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

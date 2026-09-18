import { Link } from "react-router-dom";
import NavIcon from "./NavIcon.jsx";
import { cn } from "../../lib/cn.js";
import { useTranslation } from "react-i18next";

export default function MegaMenu({ menu, open }) {
  const { t } = useTranslation();
  if (!menu?.length) return null;

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "invisible absolute left-1/2 top-full z-50 w-[min(780px,calc(100vw-2rem))] -translate-x-1/2 translate-y-2 scale-[0.98] rounded-2xl border border-border-subtle bg-surface-elevated p-5 opacity-0 shadow-elevated transition-all duration-200 ease-out",
        open && "visible translate-y-0 scale-100 opacity-100"
      )}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {menu.map((column) => (
          <section key={column.title} aria-labelledby={`mega-menu-${column.title.replace(/\s+/g, "-").toLowerCase()}`}>
            <h2
              id={`mega-menu-${column.title.replace(/\s+/g, "-").toLowerCase()}`}
              className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-content-muted"
            >
              {t(`megaMenu.${column.translationKey || column.title}`, { defaultValue: column.title })}
            </h2>
            <div className="mt-2 space-y-1">
              {column.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  tabIndex={open ? 0 : -1}
                  className="group flex gap-3 rounded-xl p-3 transition-colors hover:bg-brand-soft focus-visible:bg-brand-soft focus-visible:outline-none"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground group-focus-visible:bg-brand group-focus-visible:text-brand-foreground">
                    <NavIcon name={item.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-content-primary group-hover:text-brand group-focus-visible:text-brand">
                      {t(`megaMenu.${item.translationKey || item.label}`, { defaultValue: item.label })}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-content-muted">
                      {t(`megaMenu.${item.descriptionKey || item.description}`, { defaultValue: item.description })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-5 border-t border-border-subtle pt-4 text-right">
        <Link
          to="/support"
          tabIndex={open ? 0 : -1}
          className="text-sm font-bold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {t("megaMenu.seeResources", { defaultValue: "See all resources" })} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

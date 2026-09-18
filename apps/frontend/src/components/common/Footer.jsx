import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const columns = [
    { title: t("footer.marketplace"), links: [["/projects", t("footer.browseProjects")], ["/students", t("footer.findTalent")], ["/skills", t("footer.skillsDirectory")]] },
    { title: t("footer.community"), links: [["/universities", t("footer.forUniversities")], ["/learning", t("footer.learningHub")], ["/portfolios", t("footer.portfolios")], ["/partner-portal", t("footer.partnerPortal")]] },
    { title: t("footer.legal"), links: [["/terms", t("footer.terms")], ["/privacy", t("footer.privacy")], ["/policies", "Platform policies"], ["/support", "Support"]] },
  ];
  return (
    <footer className="border-t border-border-subtle bg-surface-elevated/90">
      <div className="mx-auto grid w-full max-w-7xl justify-items-center gap-10 px-6 py-14 text-center sm:grid-cols-2 sm:justify-items-stretch sm:text-left lg:grid-cols-4 sm:px-10 lg:px-16">
        <div>
          <Link to="/" className="flex items-center justify-center gap-2.5 sm:justify-start">
            <img src="/logo.svg" alt="NexusWork" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-extrabold tracking-tight text-content-primary">NexusWork</span>
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-content-secondary">
            {t("footer.tagline")}
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">{col.title}</p>
            <ul className="mt-3.5 space-y-2 text-xs">
              {col.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-content-secondary transition-colors hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border-subtle">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-content-secondary sm:flex-row sm:px-10 lg:px-16">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.builtForTalent")}</span>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const columns = [
    { title: t("footer.marketplace"), links: [["/projects", t("footer.browseProjects")], ["/students", t("footer.findTalent")], ["/skills", t("footer.skillsDirectory")]] },
    { title: t("footer.community"), links: [["/universities", t("footer.forUniversities")], ["/learning", t("footer.learningHub")], ["/portfolios", t("footer.portfolios")]] },
    { title: t("footer.legal"), links: [["/terms", t("footer.terms")], ["/privacy", t("footer.privacy")]] },
  ];
  return (
    <footer className="border-t border-ink-300 bg-ink">
      <div className="mx-auto grid w-full max-w-7xl justify-items-center gap-10 px-6 py-14 text-center sm:grid-cols-2 sm:justify-items-stretch sm:text-left lg:grid-cols-4 sm:px-10 lg:px-16">
        <div>
          <Link to="/" className="flex items-center justify-center gap-2.5 sm:justify-start">
            <img src="/logo.svg" alt="NexusWork" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-extrabold tracking-tight text-slate">NexusWork</span>
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-300">
            {t("footer.tagline")}
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brass">{col.title}</p>
            <ul className="mt-3.5 space-y-2 text-xs">
              {col.links.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-slate-300 transition-colors hover:text-brass">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink-300">
        <div className="flex w-full flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-slate-300 sm:flex-row sm:px-10 lg:px-16">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.builtForTalent")}</span>
        </div>
      </div>
    </footer>
  );
}

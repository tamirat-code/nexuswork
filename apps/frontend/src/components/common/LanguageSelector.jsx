import { useTranslation } from "react-i18next";
import { supported } from "../../i18n/index.js";
export default function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation();
  return <label className="inline-flex items-center gap-2 text-xs text-slate-300"><span className={compact ? "sr-only" : ""}>{t("common.language")}</span><select aria-label={t("common.language")} value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="rounded-control border border-ink-300 bg-ink-50 px-2 py-1 text-xs text-slate"><option value="en">EN</option><option value="am">አማ</option><option value="af">AF</option></select></label>;
}

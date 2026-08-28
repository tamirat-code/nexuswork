import { useTranslation } from "react-i18next";
import { supported } from "../../i18n/index.js";
import { useAuth } from "../../hooks/useAuth.js";
import { updateLanguage } from "../../services/api/users.api.js";
export default function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation();
  const { token, user, setLocalUser } = useAuth();
  const change = async (event) => {
    const language = event.target.value;
    await i18n.changeLanguage(language);
    if (token) {
      try { await updateLanguage(language, token); if (user) setLocalUser({ ...user, preferred_language: language }); } catch { /* local preference remains usable if offline */ }
    }
  };
  return <label className="inline-flex items-center gap-2 text-xs text-slate-300"><span className={compact ? "sr-only" : ""}>{t("common.language")}</span><select aria-label={t("common.language")} value={i18n.language} onChange={change} className="rounded-control border border-ink-300 bg-ink-50 px-2 py-1 text-xs text-slate"><option value="en">EN</option><option value="am">አማ</option><option value="af">AF</option></select></label>;
}

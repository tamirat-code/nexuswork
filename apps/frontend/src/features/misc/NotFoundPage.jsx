import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button.jsx";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center animate-fade-up">
      <p className="font-mono text-5xl font-bold tracking-tight text-brass/40">{t("misc.notFoundCode")}</p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate sm:text-3xl">{t("misc.notFoundTitle")}</h1>
      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-300">
        {t("misc.notFoundDesc")}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/projects">
          <Button size="md">{t("misc.browseProjects")}</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" size="md">{t("misc.backHome")}</Button>
        </Link>
      </div>
    </div>
  );
}


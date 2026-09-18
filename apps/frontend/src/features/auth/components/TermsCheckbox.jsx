import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TermsCheckbox({ checked, onChange, error }) {
  const { t } = useTranslation();
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-content-secondary">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-subtle bg-surface-soft text-brand accent-[var(--brand)]"
        />
        <span>
          {t("auth.iAgreeToThe") || "I agree to the"}{" "}
          <Link to="/terms" target="_blank" className="font-semibold text-brand hover:underline">
            {t("footer.terms") || "Terms of Service"}
          </Link>{" "}
          {t("auth.and") || "and"}{" "}
          <Link to="/privacy" target="_blank" className="font-semibold text-brand hover:underline">
            {t("footer.privacy") || "Privacy Policy"}
          </Link>
        </span>
      </label>
      {error && (
        <p className="mt-1.5 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}


import { useTranslation } from "react-i18next";

const options = [
  { value: "student", label: "auth.studentRole", hint: "auth.studentRoleHint" },
  { value: "client", label: "auth.clientRole", hint: "auth.clientRoleHint" },
  { value: "university_staff", label: "auth.staffRole", hint: "auth.staffRoleHint" },
];

function Check({ className = "" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10.3 8.8 13l5.2-6" stroke="#020f18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RolePicker({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div role="radiogroup" aria-label={t("auth.rolePickerLabel")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-card border p-4 text-left transition-colors duration-150
              ${
                selected
                  ? "border-brass bg-brass/[0.07]"
                  : "border-ink-300 bg-ink-100 hover:border-slate-300"
              }`}
          >
            {selected && <Check className="absolute right-3 top-3 h-4 w-4 text-brass" />}
            <p className={`text-sm font-semibold tracking-tight ${selected ? "text-brass" : "text-slate"}`}>
              {t(opt.label)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{t(opt.hint)}</p>
          </button>
        );
      })}
    </div>
  );
}

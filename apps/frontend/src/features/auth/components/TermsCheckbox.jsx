import { Link } from "react-router-dom";

export default function TermsCheckbox({ checked, onChange, error }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-slate-300">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 bg-ink-100 text-brass accent-[var(--brand)]"
        />
        <span>
          I agree to the{" "}
          <Link to="/terms" target="_blank" className="font-semibold text-brass hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" className="font-semibold text-brass hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && (
        <p className="mt-1.5 text-[13px] text-brick" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

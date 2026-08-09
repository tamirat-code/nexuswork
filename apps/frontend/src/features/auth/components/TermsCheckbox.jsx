import { Link } from "react-router-dom";

export default function TermsCheckbox({ checked, onChange, error }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm text-ink-500 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-ink focus:ring-brass"
        />
        <span>
          I agree to the{" "}
          <Link to="/terms" target="_blank" className="font-medium text-ink hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" className="font-medium text-ink hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && (
        <p className="text-sm text-brick mt-1.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
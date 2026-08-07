import { useState } from "react";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { calculatePasswordStrength } from "../../../utils/validation";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function SecurityStep({ register, errors, watch }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const password = watch("password") || "";
  const strength = calculatePasswordStrength(password);

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Secure your account
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Create a strong password to protect your account.
      </p>

      <div className="space-y-5">
        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
            Password *
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-white/[0.03] dark:text-white ${
                errors.password ? "border-red-500" : "border-slate-300 dark:border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength Meter */}
          {password && (
            <div className="mt-3">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i < strength.score ? strength.color : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className={`mt-1.5 text-xs font-medium ${strength.textColor}`}>
                Password strength: {strength.label}
              </p>
            </div>
          )}

          {/* Rules Checklist */}
          <div className="mt-4 space-y-1.5 rounded-lg bg-slate-50 p-3 dark:bg-white/[0.02]">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  {passed ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-600" />
                  )}
                  <span className={passed ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400"}>
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>

          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter your password"
              className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:bg-white/[0.03] dark:text-white ${
                errors.confirmPassword ? "border-red-500" : "border-slate-300 dark:border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { FileText, Shield, Mail, MessageSquare } from "lucide-react";

export default function AgreementsStep({ register, errors, watch }) {
  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Almost done!
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-zinc-400">
        Review and accept our terms to complete your registration.
      </p>

      <div className="space-y-3">
        <CheckboxItem
          register={register}
          name="agreeToTerms"
          error={errors.agreeToTerms}
          required
          icon={FileText}
          iconColor="text-blue-500"
          title={
            <>
              I agree to the{" "}
              <Link to="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                Terms of Service
              </Link>
            </>
          }
          description="Required to use NexusWork"
        />

        <CheckboxItem
          register={register}
          name="agreeToPrivacy"
          error={errors.agreeToPrivacy}
          required
          icon={Shield}
          iconColor="text-teal-500"
          title={
            <>
              I agree to the{" "}
              <Link to="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                Privacy Policy
              </Link>
            </>
          }
          description="How we protect your data"
        />

        <div className="my-4 border-t border-slate-200 dark:border-white/10" />

        <CheckboxItem
          register={register}
          name="emailUpdates"
          icon={Mail}
          iconColor="text-purple-500"
          title="Email updates"
          description="Receive news about new opportunities and platform updates"
          optional
        />

        <CheckboxItem
          register={register}
          name="smsNotifications"
          icon={MessageSquare}
          iconColor="text-amber-500"
          title="SMS notifications"
          description="Get important alerts via SMS"
          optional
        />
      </div>
    </div>
  );
}

function CheckboxItem({ register, name, error, required, icon: Icon, iconColor, title, description, optional }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
      error ? "border-red-500 bg-red-50 dark:bg-red-500/10" : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
    }`}>
      <input
        type="checkbox"
        {...register(name)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-white/20 dark:bg-white/5"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </span>
          {required && <span className="text-red-500">*</span>}
          {optional && <span className="text-xs text-slate-400">(optional)</span>}
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{description}</p>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      </div>
    </label>
  );
}
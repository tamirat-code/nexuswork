import { Check } from "lucide-react";

const STEPS = [
  { id: 0, label: "Account Type", icon: "👤" },
  { id: 1, label: "Personal Info", icon: "📋" },
  { id: 2, label: "Role Details", icon: "🎯" },
  { id: 3, label: "Security", icon: "🔒" },
  { id: 4, label: "Agreements", icon: "✓" },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300 ${
                  currentStep > step.id
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : currentStep === step.id
                    ? "border-blue-500 bg-blue-500 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.2)]"
                    : "border-slate-300 bg-white text-slate-400 dark:border-white/20 dark:bg-white/5 dark:text-zinc-500"
                }`}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id + 1}
              </div>
              <span
                className={`mt-2 hidden text-xs font-medium sm:block ${
                  currentStep >= step.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-zinc-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="mx-2 h-0.5 flex-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentStep > step.id
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
        Step {currentStep + 1} of {STEPS.length}
      </div>
    </div>
  );
}
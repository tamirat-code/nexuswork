import { Check, Sparkles } from "lucide-react";
import Button from "../ui/Button";

export default function PricingCard({ plan }) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-3xl border p-8 shadow-soft transition duration-300 hover:-translate-y-1 ${
        plan.popular
          ? "border-primary/30 bg-gradient-to-b from-primary-soft/70 via-white to-white dark:border-primary/30 dark:from-primary/10 dark:via-slate-900 dark:to-slate-900"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {plan.popular ? (
        <span className="absolute -top-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-lg">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Most Popular
        </span>
      ) : null}

      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
        {plan.name}
      </h3>

      <div className="mt-4">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {plan.price}
        </span>
        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
          {plan.period}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {plan.description}
      </p>

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      <Button
        to={plan.name === "Enterprise" ? "/contact" : "/register"}
        variant={plan.popular ? "primary" : "secondary"}
        className="mt-8 w-full"
      >
        {plan.cta}
      </Button>
    </article>
  );
}
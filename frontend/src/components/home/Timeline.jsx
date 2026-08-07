import Reveal from "../motion/Reveal";

export default function Timeline({ steps }) {
  return (
    <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <Reveal key={step.title} delay={index * 0.05} className="h-full">
            <li className="card-hover relative h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <span className="absolute right-5 top-5 text-4xl font-black text-slate-100 dark:text-slate-800">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary dark:bg-primary/10 dark:text-blue-300">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>

              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </li>
          </Reveal>
        );
      })}
    </ol>
  );
}
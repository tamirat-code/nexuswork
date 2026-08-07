import Reveal from "../motion/Reveal";

export default function FeatureCard({ feature, index }) {
  const Icon = feature.icon;

  return (
    <Reveal delay={index * 0.04} className="h-full">
      <article className="card-hover group h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition duration-300 group-hover:scale-105 dark:bg-primary/10 dark:text-blue-300">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
          {feature.title}
        </h3>

        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {feature.description}
        </p>
      </article>
    </Reveal>
  );
}
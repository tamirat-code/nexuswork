import Reveal from "../motion/Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  subtitle, // Added to support the new BentoGrid
  center = true,
  dark = false // Added to easily force white text on dark backgrounds
}) {
  const bodyText = description || subtitle;

  return (
    <Reveal
      className={`max-w-3xl ${center ? "mx-auto text-center" : ""} mb-12 md:mb-16`}
    >
      {eyebrow ? (
        <span className={`mb-4 inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] ${
          dark 
            ? "border-white/10 bg-white/5 text-zinc-300" 
            : "border-primary/15 bg-primary-soft text-primary dark:border-primary/25 dark:bg-primary/10 dark:text-blue-300"
        }`}>
          {eyebrow}
        </span>
      ) : null}

      <h2 className={`text-3xl font-extrabold tracking-tight md:text-4xl ${
        dark ? "text-white" : "text-slate-900 dark:text-white"
      }`}>
        {title}
      </h2>

      {bodyText ? (
        <p className={`mt-4 text-base leading-7 md:text-lg ${
          dark ? "text-zinc-400" : "text-slate-600 dark:text-slate-300"
        }`}>
          {bodyText}
        </p>
      ) : null}
    </Reveal>
  );
}
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function GlassCard({ children, className = "", hover = true }) {
  return (
    <motion.div
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`rounded-3xl border border-slate-200/70 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function GradientBorderCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br from-blue-500/40 via-teal-400/30 to-purple-500/40 p-px ${className}`}>
      <div className="rounded-[calc(1.5rem-1px)] bg-white/90 backdrop-blur-xl dark:bg-slate-950/90">{children}</div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto mb-14 max-w-3xl text-center">
      <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-300">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-slate-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function AnimatedButton({ to, children, variant = "primary", className = "" }) {
  const base = "group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold transition-all duration-300";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-[1.03]"
      : "border border-slate-300 bg-white/60 text-slate-800 backdrop-blur hover:border-blue-400 hover:text-blue-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:text-blue-300";
  return (
    <Link to={to} className={`${base} ${styles} ${className}`}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function LogoCloud({ logos }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
      {logos.map((l) => (
        <span key={l} className="text-sm font-extrabold tracking-wide text-slate-400 dark:text-zinc-500">{l}</span>
      ))}
    </div>
  );
}
import { motion } from "framer-motion";

const TONES = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{hint}</p>}
    </motion.div>
  );
}

export function Panel({ title, subtitle, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 dark:text-zinc-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

const STATUS_STYLES = {
  verified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  submitted: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  delivered: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  active: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  funded: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  released: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  disputed: "bg-red-500/10 text-red-600 dark:text-red-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[status] || "bg-slate-500/10 text-slate-600 dark:text-slate-300"}`}>
      {status}
    </span>
  );
}
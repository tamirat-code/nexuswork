import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const HIGHLIGHTS = [
  "Escrow-protected milestones — funds released only on approval",
  "University-verified student profiles",
  "Transparent fees, no surprise deductions",
];

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <motion.div
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col px-6 py-10 sm:px-12 lg:px-20 lg:py-14"
      >
        <Link to="/" className="inline-flex w-fit items-center gap-2.5">
          <img src="/logo.svg" alt="NexusWork" className="h-10 w-10 object-contain" />
          <span className="font-display text-xl font-extrabold tracking-tight text-slate">NexusWork</span>
        </Link>

        <div className="flex flex-1 items-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-sm"
          >
            {eyebrow && (
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">{eyebrow}</p>
            )}
            <h1 className="font-display text-[28px] leading-tight tracking-tight text-slate sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{subtitle}</p>}

            <div className="mt-7">{children}</div>

            {footer && (
              <div className="mt-7 border-t border-ink-300 pt-5 text-sm text-slate-300">{footer}</div>
            )}
          </motion.div>
        </div>

        <p className="text-xs text-slate-300">© {new Date().getFullYear()} NexusWork. All rights reserved.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 120 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="relative hidden overflow-hidden border-l border-ink-300 bg-ink-100 lg:flex lg:items-start"
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <motion.div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/10 blur-3xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="relative mt-[18vh] w-full max-w-xl px-12 xl:mt-[22vh] xl:px-16">
          <motion.div
            className="mb-8 h-1 rounded-full bg-gradient-to-r from-brass via-brand to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 88, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.72, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.55, delay: 0.52, ease: [0.16, 1, 0.3, 1] }}
          >
            <SealMark className="mb-7 h-14 w-14 text-brass" />
          </motion.div>
          <p className="max-w-md font-display text-[26px] font-semibold leading-snug tracking-tight text-slate xl:text-3xl">
            Verified student talent. Escrow-protected work.
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            A focused workspace for ambitious students and clients who value clear delivery.
          </p>
          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-300 transition-transform hover:translate-x-1">
                <SealMark className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export function SealMark({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 16.5 14 20l8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

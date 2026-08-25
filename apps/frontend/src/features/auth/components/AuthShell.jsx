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
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-20 lg:py-14">
        <Link to="/" className="inline-flex w-fit items-center gap-2.5">
          <SealMark className="h-7 w-7 text-brass" />
          <span className="font-display text-lg font-medium tracking-tight text-slate">NexusWork</span>
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
      </div>

      <div className="relative hidden overflow-hidden border-l border-ink-300 bg-ink-100 lg:flex lg:items-center">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/10 blur-3xl" />
        <div className="relative w-full px-12 xl:px-16">
          <SealMark className="mb-7 h-12 w-12 text-brass" />
          <p className="max-w-sm font-display text-[26px] leading-snug tracking-tight text-slate">
            Verified student talent. Escrow-protected work.
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                <SealMark className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
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

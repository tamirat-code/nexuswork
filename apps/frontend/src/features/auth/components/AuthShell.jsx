
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <SealMark className="h-7 w-7" />
            <span className="font-display text-lg font-medium text-ink">NexusWork</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {eyebrow && (
              <p className="text-xs font-semibold tracking-wide uppercase text-brass-700 mb-2">{eyebrow}</p>
            )}
            <h1 className="font-display text-3xl text-ink mb-2">{title}</h1>
            {subtitle && <p className="text-sm text-slate mb-8">{subtitle}</p>}

            {children}
          </motion.div>

          {footer && <div className="mt-8 text-sm text-slate">{footer}</div>}
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-ink relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative text-center px-12">
          <SealMark className="h-16 w-16 mx-auto mb-6 text-brass" />
          <p className="font-display text-2xl text-white leading-snug max-w-xs mx-auto">
            Verified student talent. Escrow-protected work.
          </p>
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
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Quote } from "lucide-react";

function VerificationSeal({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2 21 6.5V15L12 22 3 15V6.5L12 2Z" fill="url(#authSealGradient)" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
      <path d="M8.5 12.2 10.8 14.5 15.5 9.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="authSealGradient" x1="3" y1="2" x2="21" y2="22">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AuthLayout({ children, title, subtitle }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2 dark:bg-zinc-950 transition-colors duration-300">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden border-r border-slate-200 dark:border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-12 bg-slate-50 dark:bg-transparent">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-blue-400/10 dark:bg-blue-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-teal-300/10 dark:bg-teal-500/15 blur-[110px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:56px_56px]" />
        </div>

        <Link to="/" className="flex items-center gap-2">
          <VerificationSeal className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">NexusWork</span>
        </Link>

        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white">
            Every profile here is checked by an actual registrar.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
            No stock photos, no fake reviews. Just students whose universities have confirmed they are who they say they are.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 shadow-sm dark:backdrop-blur-xl"
          >
            <Quote className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">
              I funded my final year's tuition doing frontend work I found here — clients trusted me faster because AASTU had already verified my transcript.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Selam A.</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">AASTU, Software Eng.</p>
              </div>
              <ShieldCheck className="ml-auto h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </motion.div>
        </div>

        <p className="text-xs text-slate-500 dark:text-zinc-600">
          © {new Date().getFullYear()} NexusWork. Built with partner universities.
        </p>
      </div>

      {/* Right: form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-500 transition-colors hover:text-slate-900 dark:hover:text-zinc-300 lg:hidden">
          <VerificationSeal className="h-5 w-5" />
          NexusWork
        </Link>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-sm"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
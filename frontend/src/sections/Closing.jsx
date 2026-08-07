import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Lock, KeyRound, ScrollText, ChevronDown, GraduationCap } from "lucide-react";
import Reveal from "../components/motion/Reveal";
import { SectionHeading, GlassCard } from "../components/ui/primitives";
import { faqs } from "../data/home";

export function Security() {
  const ITEMS = [
    { icon: Lock, t: "Milestone escrow", d: "Client funds are locked before work begins and released only on approval." },
    { icon: KeyRound, t: "2FA & session control", d: "TOTP two-factor auth with device management and audit trails." },
    { icon: ShieldCheck, t: "Registrar verification", d: "Every profile is confirmed by an actual university office." },
    { icon: ScrollText, t: "Immutable audit log", d: "Every financial and admin action is recorded permanently." },
  ];
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">Security first</span>
            <h2 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">Trust is the product</h2>
            <p className="mt-4 text-slate-500 dark:text-zinc-400">NexusWork is engineered like a financial platform — because student income deserves bank-grade protection.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ITEMS.map((it) => (
                <div key={it.t} className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                  <it.icon className="h-6 w-6 text-emerald-500" />
                  <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">{it.t}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{it.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <GlassCard hover={false} className="p-10 text-center">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity }} className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40">
                <ShieldCheck className="h-14 w-14 text-white" />
              </motion.div>
              <p className="mt-8 text-4xl font-black text-slate-900 dark:text-white">$48,200</p>
              <p className="mt-1 text-sm font-bold text-slate-400">protected in escrow right now</p>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
                <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-black text-slate-900 dark:text-white">
                  {f.q}
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <p className="px-6 pb-6 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-14 text-center text-white shadow-2xl shadow-blue-500/30 sm:p-20">
            <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
            <h2 className="relative text-4xl font-black sm:text-5xl">Your career starts on campus.<br />It compounds on NexusWork.</h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-white/80">Join the verified network where every project builds your portfolio, your income and your proof.</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="rounded-2xl bg-white px-8 py-4 text-sm font-black text-blue-700 shadow-xl transition-transform hover:scale-105">Create free account</Link>
              <Link to="/projects" className="rounded-2xl border border-white/40 px-8 py-4 text-sm font-black text-white backdrop-blur hover:bg-white/10">Browse projects</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const COLS = [
    { t: "Platform", l: ["Find Projects", "Hire Talent", "Pricing", "Universities"] },
    { t: "Company", l: ["About", "Careers", "Blog", "Contact"] },
    { t: "Legal", l: ["Terms", "Privacy", "Cookies"] },
  ];
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 py-16 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-5 lg:px-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white"><GraduationCap className="h-5 w-5" /></span>
            <span className="text-lg font-black text-slate-900 dark:text-white">NexusWork</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-slate-500 dark:text-zinc-400">The AI-powered, university-verified freelance marketplace.</p>
          <p className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> All systems operational</p>
        </div>
        {COLS.map((c) => (
          <div key={c.t}>
            <p className="text-sm font-black text-slate-900 dark:text-white">{c.t}</p>
            <ul className="mt-4 space-y-2">{c.l.map((x) => <li key={x}><Link to="/" className="text-sm text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-300">{x}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-200/60 px-4 pt-6 text-center text-xs font-bold text-slate-400 dark:border-white/10">
        © {new Date().getFullYear()} NexusWork. Built with partner universities across Ethiopia.
      </div>
    </footer>
  );
}
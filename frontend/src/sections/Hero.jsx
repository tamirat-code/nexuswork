import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BadgeCheck, Sparkles, Wallet, FileText, ShieldCheck } from "lucide-react";
import { AnimatedButton, GlassCard } from "../components/ui/primitives";
import AnimatedCounter from "../components/motion/AnimatedCounter";

const UNIVERSITIES = ["Addis Ababa Univ.", "AASTU", "AAiT", "Bahir Dar", "Jimma", "Hawassa"];

export default function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const px1 = useTransform(sx, (v) => v * 24);
  const py1 = useTransform(sy, (v) => v * 18);
  const px2 = useTransform(sx, (v) => v * -18);
  const py2 = useTransform(sy, (v) => v * -14);

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-20"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.width / 2) / r.width);
        my.set((e.clientY - r.height / 2) / r.height);
      }}
    >
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-blue-500/15 blur-[130px] dark:bg-blue-600/25" />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} className="absolute right-0 top-1/3 h-[30rem] w-[30rem] rounded-full bg-teal-400/15 blur-[130px] dark:bg-teal-500/20" />
        <motion.div animate={{ x: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-1/2 h-[26rem] w-[26rem] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-600/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent)]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-4 lg:grid-cols-2 lg:px-8">
        {/* Left */}
        <div>
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-300">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered · University-verified
          </motion.span>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl xl:text-7xl dark:text-white">
            Where verified students do <span className="bg-gradient-to-r from-blue-600 via-teal-500 to-purple-500 bg-clip-text text-transparent">real work</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mt-6 max-w-xl text-lg text-slate-600 dark:text-zinc-300">
            NexusWork matches university-verified talent with companies using AI — protected by milestone escrow and trusted by registrars.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-9 flex flex-wrap gap-4">
            <AnimatedButton to="/register">Start earning</AnimatedButton>
            <AnimatedButton to="/projects" variant="secondary">Hire talent</AnimatedButton>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-12">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Trusted by partner universities</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {UNIVERSITIES.map((u) => (
                <span key={u} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-zinc-400">
                  <BadgeCheck className="h-4 w-4 text-teal-500" /> {u}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: live dashboard mockup */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.25 }} className="relative">
          <GlassCard hover={false} className="p-6">
            <div className="flex items-center gap-1.5 border-b border-slate-200/70 pb-4 dark:border-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-bold text-slate-400">nexuswork.io/dashboard</span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 p-5 text-white shadow-xl shadow-blue-500/25">
                <div className="flex items-center justify-between"><p className="text-xs font-bold opacity-80">AI MATCH</p><Sparkles className="h-4 w-4" /></div>
                <p className="mt-1 text-lg font-black">Event Web App — 96% fit</p>
                <div className="mt-3 h-1.5 rounded-full bg-white/25"><motion.div initial={{ width: 0 }} animate={{ width: "96%" }} transition={{ duration: 1.2, delay: 0.8 }} className="h-1.5 rounded-full bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                  <p className="flex items-center gap-1 text-xs font-bold text-slate-400"><Wallet className="h-3.5 w-3.5 text-teal-500" /> WALLET</p>
                  <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">$1,850</p>
                  <p className="text-[11px] font-bold text-emerald-500">+$450 released</p>
                </div>
                <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                  <p className="flex items-center gap-1 text-xs font-bold text-slate-400"><FileText className="h-3.5 w-3.5 text-blue-500" /> CONTRACT</p>
                  <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">Milestone 2/3</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" /></div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Floating cards with parallax */}
          <motion.div style={{ x: px1, y: py1 }} animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-6 -top-6 rounded-2xl border border-emerald-500/30 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl dark:bg-slate-900/90">
            <p className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400"><ShieldCheck className="h-4 w-4" /> Escrow funded · $450</p>
          </motion.div>
          <motion.div style={{ x: px2, y: py2 }} animate={{ y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-6 -right-4 rounded-2xl border border-blue-500/30 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl dark:bg-slate-900/90">
            <p className="text-xs font-black text-slate-900 dark:text-white">🎓 Verified by AAiT Registrar</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Live stats strip */}
      <div className="absolute inset-x-0 bottom-0 border-t border-slate-200/60 bg-white/60 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-8 py-6 sm:grid-cols-4">
          {[
            { v: 1842, l: "Verified students" },
            { v: 214, l: "Active projects" },
            { v: 48200, p: "$", l: "Escrow protected" },
            { v: 68, s: "%", l: "Employment rate" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-2xl font-black text-slate-900 dark:text-white"><AnimatedCounter value={s.v} prefix={s.p || ""} suffix={s.s || ""} /></p>
              <p className="text-xs font-bold text-slate-400">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
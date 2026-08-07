import { useRef, useEffect } from "react";
import heroIllustration from "../../assets/images/hero-illustration.png";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, ShieldCheck, CheckCircle2, Play } from "lucide-react";
import Container from "../ui/Container";
import Button from "../ui/Button";

/* Signature motif: hexagonal "verification seal" */
function VerificationSeal({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2 21 6.5V15L12 22 3 15V6.5L12 2Z"
        fill="url(#sealGradient)"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <path
        d="M8.5 12.2 10.8 14.5 15.5 9.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sealGradient" x1="3" y1="2" x2="21" y2="22">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Animated stat number */
function AnimatedStat({ value, suffix = "", label }) {
  const ref = useRef(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 24, stiffness: 60 });
  const display = useTransform(springValue, (v) => Math.floor(v).toLocaleString());

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          motionValue.set(value);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col">
      <span className="font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        <motion.span>{display}</motion.span>
        {suffix}
      </span>
      <span className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  /* Subtle 3D tilt on the floating mockup */
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [6, -6]);
  const rotateY = useTransform(x, [-60, 60], [-6, 6]);

  
  

  return (
    <section className="relative overflow-hidden bg-white dark:bg-zinc-950 pt-32 pb-24 sm:pt-40 sm:pb-32 transition-colors duration-300">
      {/* Ambient background glow & grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Glows adapt to light/dark */}
        <div className="absolute -top-40 left-1/4 h-[32rem] w-[32rem] rounded-full bg-blue-400/10 dark:bg-blue-600/20 blur-[120px] transition-colors duration-500" />
        <div className="absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10 dark:bg-indigo-600/20 blur-[120px] transition-colors duration-500" />
        <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-teal-300/10 dark:bg-teal-500/10 blur-[100px] transition-colors duration-500" />
        
        {/* Grid Pattern adapts to light/dark */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a08_1px,transparent_1px),linear-gradient(to_bottom,#0f172a08_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-12">
          {/* ---------------- Left: copy ---------------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 backdrop-blur transition-colors">
              <VerificationSeal className="h-4 w-4" />
              Backed by Addis Ababa University &amp; AASTU registrars
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Turn verified skills into{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 dark:from-blue-400 dark:via-indigo-400 dark:to-teal-300 bg-clip-text text-transparent">
                real income
              </span>
              , with a university standing behind you.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-zinc-400">
              Every profile is identity- and transcript-checked by a partner
              university. Every project is paid through milestone escrow —
              funds release only when work is approved. No more chasing
              invoices, no more guessing who's real.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base text-white shadow-lg shadow-blue-500/20 dark:shadow-[0_0_40px_-8px_rgba(37,99,235,0.6)] transition-transform hover:scale-[1.02]">
                Get skill-verified
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent px-5 py-3 text-sm font-medium text-slate-700 dark:text-zinc-200 shadow-sm dark:shadow-none transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                <Play className="h-4 w-4" />
                Watch how escrow works
              </button>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-8 border-t border-slate-200 dark:border-white/10 pt-8 max-w-md">
              <AnimatedStat value={4200} suffix="+" label="Verified students" />
              <AnimatedStat value={186} suffix="k" label="ETB in active escrow" />
              <AnimatedStat value={11} suffix="hrs" label="Avg. AI match time" />
            </div>
          </motion.div>

          {/* ---------------- Right: Hero Illustration ---------------- */}
<motion.div
  initial={{ opacity: 0, scale: 0.94, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
  className="relative lg:col-span-5 flex items-center justify-center"
>
  {/* Ambient glow behind the image for Dark Mode */}
  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-teal-500/20 blur-3xl rounded-full dark:opacity-100 opacity-40 transition-opacity duration-500" />
  
  <img 
    src={heroIllustration} 
    alt="University students collaborating and building verified skills" 
    className="relative z-10 w-full max-w-lg drop-shadow-2xl dark:drop-shadow-[0_0_40px_rgba(37,99,235,0.25)] transition-all duration-500"
  />
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative mx-auto h-[440px] w-full max-w-sm"
            >
              {/* Main profile card */}
              <div className="absolute inset-x-4 top-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] p-6 shadow-xl dark:shadow-2xl dark:backdrop-blur-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Bemnet T.</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">B.Sc. Software Eng. — AAiT, Year 4</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {["React", "Node.js", "PostgreSQL"].map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-transparent transition-colors"
                    >
                      <VerificationSeal className="h-3 w-3" />
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-6 h-px w-full bg-slate-200 dark:bg-white/10" />

                <div className="mt-5">
                  <p className="text-xs text-slate-500 dark:text-zinc-500">Current milestone</p>
                  <p className="mt-1 text-sm text-slate-800 dark:text-zinc-200">
                    E-commerce checkout flow — 2 of 3 complete
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
                  </div>
                </div>
              </div>

              {/* Floating badge: University Verified */}
              <motion.div
                animate={
                  prefersReducedMotion ? {} : { y: [0, -8, 0] }
                }
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-2 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/80 px-3.5 py-2.5 shadow-lg dark:shadow-glow dark:backdrop-blur-xl transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">University Verified</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">by AAiT Registrar</p>
                </div>
              </motion.div>

              {/* Floating badge: Escrow Funded */}
              <motion.div
                animate={
                  prefersReducedMotion ? {} : { y: [0, 8, 0] }
                }
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute -left-6 bottom-4 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900/80 px-3.5 py-2.5 shadow-lg dark:shadow-glow dark:backdrop-blur-xl transition-colors"
              >
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Escrow funded</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">4,500 ETB via Chapa</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
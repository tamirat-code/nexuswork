import { motion } from "framer-motion";
import {
  GraduationCap,
  Lock,
  Sparkles,
  BadgeCheck,
  Scale,
} from "lucide-react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* Adaptive Card Shell: Clean white in Light Mode, Glassmorphism in Dark Mode */
function BentoCard({ className = "", children }) {
  return (
    <motion.div
      variants={item}
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 sm:p-7
        bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300
        dark:bg-white/[0.03] dark:border-white/10 dark:shadow-none dark:hover:border-white/20 dark:backdrop-blur-xl
        ${className}`}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent dark:from-white/[0.04] dark:to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

export default function BentoGrid() {
  return (
    <section className="relative bg-slate-50 dark:bg-zinc-950 py-24 sm:py-32 transition-colors duration-300">
      <Container>
        {/* We don't pass `dark={true}` so it automatically adapts to light/dark text */}
        <SectionHeading
          eyebrow="Why not just use Upwork"
          title="A trust layer Upwork can't offer"
          subtitle="Every safeguard below exists because a university, not just an algorithm, is willing to vouch for it."
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
        >
          {/* --- Card 1: University Verification (large, anchor card) --- */}
          <BentoCard className="lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col justify-between relative z-10">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900 dark:text-white">
                  University-backed verification
                </h3>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  Identity, enrollment, and transcript checks run directly
                  through each school's registrar — not a scanned ID upload.
                  A "Verified" badge here means an institution confirmed it.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {["Addis Ababa University", "AASTU", "AAiT"].map((uni) => (
                  <span
                    key={uni}
                    className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-zinc-300 transition-colors"
                  >
                    {uni}
                  </span>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* --- Card 2: Milestone Escrow --- */}
          <BentoCard>
            <div className="relative z-10">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                Milestone escrow
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Clients fund each milestone via Chapa or telebirr before work
                starts. Payment releases the moment it's approved.
              </p>
              <div className="mt-5 space-y-2">
                {["Deposit", "In progress", "Released"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < 2 ? "bg-teal-500 dark:bg-teal-400" : "bg-slate-200 dark:bg-white/10"
                      }`}
                    />
                    <span className="w-20 text-right text-[11px] font-medium text-slate-500 dark:text-zinc-500">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* --- Card 3: AI Semantic Matching --- */}
          <BentoCard>
            <div className="relative z-10">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                AI semantic matching
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Skills are embedded, not keyword-tagged — a "computer vision"
                project reaches students who never typed those exact words.
              </p>
              {/* SVG lines remain vibrant and work perfectly on both light and dark backgrounds */}
              <svg viewBox="0 0 200 60" className="mt-5 h-14 w-full opacity-90 dark:opacity-80">
                <circle cx="20" cy="30" r="4" fill="#4F46E5" />
                <circle cx="180" cy="14" r="4" fill="#14B8A6" />
                <circle cx="180" cy="46" r="4" fill="#14B8A6" />
                <path
                  d="M20 30 L180 14"
                  stroke="url(#matchLine)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <path
                  d="M20 30 L180 46"
                  stroke="url(#matchLine)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <defs>
                  <linearGradient id="matchLine" x1="0" x2="1">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </BentoCard>

          {/* --- Card 4: Skill Certification (wide) --- */}
          <BentoCard className="sm:col-span-2">
            <div className="flex items-start justify-between gap-6 relative z-10">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                  Proctored skill certifications
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  Timed, proctored assessments co-written with CS faculty.
                  Pass one and it's stamped straight onto your public profile.
                </p>
              </div>
              <div className="hidden shrink-0 flex-col gap-2 sm:flex">
                {[
                  { tier: "Gold", light: "text-amber-600 border-amber-200 bg-amber-50", dark: "dark:text-amber-300 dark:border-amber-300/30 dark:bg-amber-300/10" },
                  { tier: "Silver", light: "text-slate-600 border-slate-200 bg-slate-50", dark: "dark:text-zinc-300 dark:border-zinc-300/30 dark:bg-zinc-300/10" },
                  { tier: "Bronze", light: "text-orange-600 border-orange-200 bg-orange-50", dark: "dark:text-orange-400 dark:border-orange-400/30 dark:bg-orange-400/10" },
                ].map((t) => (
                  <span
                    key={t.tier}
                    className={`rounded-full border px-3 py-1 text-center text-[11px] font-semibold transition-colors ${t.light} ${t.dark}`}
                  >
                    {t.tier}
                  </span>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* --- Card 5: Dispute Resolution --- */}
          <BentoCard>
            <div className="relative z-10">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-colors">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">
                Dispute resolution board
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Unresolved disputes escalate to a university ombudsperson, not
                a support queue — most close within 72 hours.
              </p>
            </div>
          </BentoCard>
        </motion.div>
      </Container>
    </section>
  );
}
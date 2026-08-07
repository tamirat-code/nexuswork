import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Wallet, BarChart3, MessagesSquare } from "lucide-react";
import Reveal from "../components/motion/Reveal";
import { SectionHeading, GradientBorderCard } from "../components/ui/primitives";

const CARDS = [
  { icon: Sparkles, title: "AI Project Matching", desc: "Semantic analysis ranks every open project by your verified skills, portfolio and history — so you only see work you can win.", big: true, tone: "from-blue-600 to-indigo-600" },
  { icon: ShieldCheck, title: "University Verification", desc: "Registrars confirm enrollment and certify skills on-chain.", tone: "from-teal-500 to-emerald-600" },
  { icon: Wallet, title: "Milestone Escrow", desc: "Funds locked per milestone, released on approval.", tone: "from-purple-500 to-fuchsia-600" },
  { icon: BarChart3, title: "Outcome Analytics", desc: "Employment and earnings dashboards for universities.", tone: "from-amber-500 to-orange-600" },
  { icon: MessagesSquare, title: "Contract Chat", desc: "Scoped messaging with read receipts and attachments.", big: true, tone: "from-sky-500 to-blue-600" },
];

export default function AIFeatures() {
  return (
    <section id="features" className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading eyebrow="Platform intelligence" title="Built like a fintech, trusted like a university" subtitle="Every layer engineered for trust, speed and measurable outcomes." />
        <div className="grid gap-5 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08} className={c.big ? "md:col-span-2" : ""}>
              <GradientBorderCard className="h-full">
                <motion.div whileHover={{ scale: 1.015 }} className="h-full p-8">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.tone} text-white shadow-lg`}>
                    <c.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{c.desc}</p>
                </motion.div>
              </GradientBorderCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
import { UserPlus, Sparkles, FileText, Wallet, GraduationCap } from "lucide-react";
import Reveal from "../components/motion/Reveal";
import { SectionHeading, GlassCard, AnimatedButton } from "../components/ui/primitives";

const STEPS = [
  { icon: UserPlus, title: "Register & verify", desc: "Sign up with your university email; the registrar confirms your enrollment in one click." },
  { icon: Sparkles, title: "Get AI-matched", desc: "The engine ranks open projects against your certified skill record." },
  { icon: FileText, title: "Contract & build", desc: "Milestones, escrow and chat keep delivery transparent for both sides." },
  { icon: Wallet, title: "Get paid & certified", desc: "Funds release on approval; every win is added to your verified portfolio." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeading eyebrow="Student journey" title="From enrollment to income in four steps" />
        <div className="relative space-y-10 before:absolute before:left-6 before:top-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-teal-400 before:to-purple-500">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="relative pl-20">
              <span className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{i + 1}. {s.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UniversityPartnership() {
  return (
    <section id="universities" className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <GlassCard hover={false} className="grid gap-10 p-10 lg:grid-cols-2 lg:p-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-600 dark:text-purple-300"><GraduationCap className="h-4 w-4" /> For institutions</span>
            <h2 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">Give your students a verified path to income</h2>
            <p className="mt-4 text-slate-500 dark:text-zinc-400">One-click enrollment verification, skill certification and live graduate-outcome analytics — no paperwork.</p>
            <AnimatedButton to="/register" className="mt-8">Partner with NexusWork</AnimatedButton>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["342", "students verified"], ["1,208", "skills certified"], ["68%", "employment rate"], ["12", "partner universities"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6 text-center">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{v}</p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-zinc-400">{l}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
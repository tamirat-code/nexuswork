import { Star, Clock, Send, Sparkles } from "lucide-react";
import Reveal from "../components/motion/Reveal";
import { SectionHeading, GlassCard } from "../components/ui/primitives";
import { projects, freelancers, testimonials } from "../data/home";

export function FeaturedProjects() {
  return (
    <section id="marketplace" className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading eyebrow="Live marketplace" title="Projects matched to real skill" subtitle="A sample of what verified students are winning right now." />
        <div className="grid gap-6 md:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <GlassCard className="flex h-full flex-col p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-black text-teal-600 dark:text-teal-400">{p.budget}</span>
                  {p.match >= 90 && <span className="flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-1 text-[11px] font-black text-blue-600 dark:text-blue-300"><Sparkles className="h-3 w-3" />{p.match}%</span>}
                </div>
                <h3 className="mt-4 text-lg font-black text-slate-900 dark:text-white">{p.title}</h3>
                <div className="mt-3 flex flex-wrap gap-2">{p.skills.map((s) => <span key={s} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-white/5 dark:text-zinc-300">{s}</span>)}</div>
                <div className="mt-auto flex gap-4 pt-5 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{p.duration}</span>
                  <span className="flex items-center gap-1"><Send className="h-3.5 w-3.5" />{p.proposals} proposals</span>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TopFreelancers() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading eyebrow="Verified talent" title="Meet the top of the class" />
        <div className="grid gap-6 md:grid-cols-3">
          {freelancers.map((f, i) => (
            <Reveal key={f.id} delay={i * 0.1}>
              <GlassCard className="p-7 text-center">
                <div className={`mx-auto h-20 w-20 rounded-full bg-gradient-to-br ${f.gradient} p-[3px]`}>
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl font-black text-slate-900 dark:bg-slate-950 dark:text-white">
                    {f.image ? <img src={f.image} alt={f.name} className="h-full w-full rounded-full object-cover" /> : f.initials}
                  </div>
                </div>
                <h3 className="mt-4 font-black text-slate-900 dark:text-white">{f.name}</h3>
                <p className="text-xs font-bold text-slate-400">{f.university}</p>
                <p className="mt-2 flex items-center justify-center gap-1 text-sm font-black text-amber-500"><Star className="h-4 w-4 fill-current" />{f.rating} · {f.completedProjects} projects</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeading eyebrow="Success stories" title="Real outcomes, real people" />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <GlassCard className="flex h-full flex-col p-7">
                <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current text-amber-500" />)}</div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-black text-white">{t.name.charAt(0)}</span>
                  <div><p className="text-sm font-black text-slate-900 dark:text-white">{t.name}</p><p className="text-xs font-bold text-slate-400">{t.role}</p></div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
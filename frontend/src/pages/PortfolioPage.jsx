import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award, MapPin, Clock, CheckCircle2, Star, Share2, Download,
  GraduationCap, Briefcase, BadgeCheck, TrendingUp, Eye, ExternalLink, Mail,
} from "lucide-react";
import { Panel } from "../components/dashboard/ui";
import { useNotifications } from "../context/NotificationContext";
import { PORTFOLIO } from "../data/portfolio";

export default function PortfolioPage() {
  const { notify } = useNotifications();
  const [view, setView] = useState("private"); // private | public

  const sharePortfolio = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/selam-m`);
    notify("Public portfolio link copied!", "success");
  };

  const downloadPdf = () => notify("PDF portfolio generation started.", "success");

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Portfolio</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {view === "private" ? "Your private portfolio builder" : "Public preview (what clients see)"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("private")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              view === "private" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setView("public")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              view === "public" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"
            }`}
          >
            <Eye className="inline h-4 w-4" /> Public Preview
          </button>
          <button onClick={sharePortfolio} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button onClick={downloadPdf} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 shadow-sm dark:border-white/10 dark:from-blue-500/5 dark:via-slate-900 dark:to-indigo-500/5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black text-white shadow-xl">
              {PORTFOLIO.hero.name.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900">
              <BadgeCheck className="h-4 w-4 text-white" />
            </span>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{PORTFOLIO.hero.name}</h1>
            <p className="mt-1 text-lg font-semibold text-blue-600 dark:text-blue-400">{PORTFOLIO.hero.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /> {PORTFOLIO.hero.university} ({PORTFOLIO.hero.year})</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {PORTFOLIO.hero.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {PORTFOLIO.hero.responseTime}</span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{PORTFOLIO.hero.bio}</p>
          </div>

          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
              <Mail className="h-4 w-4" /> Hire Me
            </button>
            <Link to="/contracts" className="text-center text-xs font-semibold text-slate-500 hover:underline dark:text-zinc-400">
              View contract history
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Completed Projects" value={PORTFOLIO.stats.completed} icon={Briefcase} />
        <StatBox label="Total Earned" value={`$${PORTFOLIO.stats.totalEarnings.toLocaleString()}`} icon={TrendingUp} />
        <StatBox label="Average Rating" value={PORTFOLIO.stats.avgRating} icon={Star} suffix="/5" />
        <StatBox label="Client Reviews" value={PORTFOLIO.stats.reviews} icon={Award} />
      </div>

      {/* Skills */}
      <Panel title="Verified Skills" subtitle="University-certified and self-declared skills">
        <div className="space-y-3">
          {PORTFOLIO.skills.map((s) => (
            <div key={s.name}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{s.name}</span>
                  {s.verified && <BadgeCheck className="h-3.5 w-3.5 text-teal-500" />}
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{s.level}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className={`h-2 rounded-full ${s.verified ? "bg-gradient-to-r from-teal-500 to-emerald-500" : "bg-slate-400 dark:bg-zinc-600"}`}
                  style={{ width: `${s.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Case Studies */}
      <Panel title="Featured Case Studies" subtitle="Auto-generated from approved contracts">
        <div className="space-y-4">
          {PORTFOLIO.caseStudies.map((cs) => (
            <div key={cs.id} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {cs.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                        <BadgeCheck className="h-3 w-3" /> Verified Contract
                      </span>
                    )}
                    <span className="text-xs text-slate-400">${cs.budget} · {cs.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cs.title}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
                    Client: {cs.client} <Star className="h-3 w-3 fill-current text-amber-500" /> {cs.clientRating}
                  </p>
                </div>
                <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">
                  View Details <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <p className="mt-4 text-sm text-slate-600 dark:text-zinc-300">{cs.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {cs.tags.map((t) => (
                  <span key={t} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {cs.deliverables.map((d) => (
                  <div key={d} className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {d}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client Review</p>
                <p className="mt-1 text-sm italic text-slate-700 dark:text-zinc-200">"{cs.review}"</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Two-column: Education + Certificates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Education" subtitle="Academic background">
          <div className="space-y-3">
            {PORTFOLIO.education.map((e) => (
              <div key={e.degree} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 dark:border-white/5">
                <GraduationCap className="mt-0.5 h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{e.degree}</p>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">{e.institution} · {e.year}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">CGPA: {e.cgpa}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Certificates" subtitle="Verified credentials">
          <div className="space-y-3">
            {PORTFOLIO.certificates.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 dark:border-white/5">
                <Award className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{c.issuer} · {c.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Reviews */}
      <Panel title="Client Reviews" subtitle="What clients say about working with you">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PORTFOLIO.reviews.map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-5 dark:border-white/5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-bold text-slate-900 dark:text-white">{r.client}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < r.rating ? "fill-current text-amber-500" : "text-slate-300"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{r.project} · {r.date}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">"{r.text}"</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, suffix }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <Icon className="h-4 w-4 text-blue-500" />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}{suffix && <span className="text-sm font-semibold text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}
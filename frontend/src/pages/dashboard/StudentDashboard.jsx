import { Link } from "react-router-dom";
import { Eye, Send, FileText, Wallet, Sparkles, ArrowRight, ShieldCheck, Clock, BadgeCheck, BookOpen } from "lucide-react";
import { StatCard, Panel, StatusBadge } from "../../components/dashboard/ui";
import { ChartCard, EarningsAreaChart } from "../../components/dashboard/charts";
import MessagesPanel from "../../components/dashboard/MessagesPanel";
import { useAuth } from "../../context/AuthContext";
import { monthlyEarnings, skillDemand } from "../../data/metrics";
import { SkillDemandBarChart } from "../../components/dashboard/charts";

const RECOMMENDED = [
  { id: 1, title: "University Event Management Web App", budget: "$800", match: 96, skills: ["React", "Node.js"] },
  { id: 2, title: "Student Performance Analytics Dashboard", budget: "$1,200", match: 91, skills: ["Data Viz", "React"] },
  { id: 3, title: "Campus Marketplace UI/UX Design", budget: "$600", match: 87, skills: ["Figma", "UI/UX"] },
];

const MILESTONES = [
  { id: 1, title: "Checkout flow — Event Web App", status: "delivered", due: "Aug 12", amount: "$300" },
  { id: 2, title: "Admin panel — Event Web App", status: "funded", due: "Aug 20", amount: "$450" },
];

const SKILL_VERIFICATIONS = [
  { skill: "React", method: "university_certified", status: "verified" },
  { skill: "Node.js", method: "assessment", status: "verified" },
  { skill: "UI/UX Design", method: "self_declared", status: "pending" },
];

const LEARNING = [
  { course: "Advanced React Patterns", progress: 72 },
  { course: "Freelance Client Communication", progress: 40 },
];

function ProgressBar({ value, color = "bg-blue-500" }) {
  return (
    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const profileCompletion = 80;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Your freelance workspace at a glance.</p>
        </div>
        <StatusBadge status="verified" />
      </div>

      {/* Profile completion + verification */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Profile completion</p>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">{profileCompletion}%</span>
          </div>
          <div className="mt-3"><ProgressBar value={profileCompletion} /></div>
          <p className="mt-2 text-xs text-slate-400">Add a portfolio item and certify one more skill to reach 100%.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-teal-500" /> University verification</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">Enrollment verified by AAiT Registrar on Jul 28, 2026.</p>
          <div className="mt-3"><StatusBadge status="verified" /></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Wallet balance" value="$750" hint="$450 in escrow" tone="amber" />
        <StatCard icon={FileText} label="Active contracts" value="2" hint="1 milestone due" tone="teal" />
        <StatCard icon={Send} label="Proposal success" value="33%" hint="3 of 9 accepted" tone="indigo" />
        <StatCard icon={Eye} label="Profile views" value="128" hint="+12% this week" tone="blue" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly earnings" subtitle="Released milestone payments (USD)">
          <EarningsAreaChart data={monthlyEarnings} />
        </ChartCard>
        <ChartCard title="Skill demand" subtitle="Marketplace demand for your skills">
          <SkillDemandBarChart data={skillDemand} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI recommendations */}
        <div className="lg:col-span-2">
          <Panel title="AI-recommended projects" subtitle="Ranked by skill match"
            action={<Link to="/projects" className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">View all <ArrowRight className="h-3 w-3" /></Link>}>
            <div className="space-y-3">
              {RECOMMENDED.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 hover:border-blue-200 dark:border-white/5 dark:hover:border-blue-500/30">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">{p.budget}</span>
                      {p.skills.map((s) => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">{s}</span>)}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-300"><Sparkles className="h-3 w-3" />{p.match}%</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right column: skills + learning */}
        <div className="space-y-6">
          <Panel title="Skill verification" subtitle="Structured skill record">
            <div className="space-y-3">
              {SKILL_VERIFICATIONS.map((s) => (
                <div key={s.skill} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                    <BadgeCheck className="h-4 w-4 text-teal-500" /> {s.skill}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Learning progress" subtitle="Skill-gap training">
            <div className="space-y-4">
              {LEARNING.map((l) => (
                <div key={l.course}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-200"><BookOpen className="h-3 w-3" /> {l.course}</span>
                    <span className="text-slate-400">{l.progress}%</span>
                  </div>
                  <ProgressBar value={l.progress} color="bg-teal-500" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <Panel title="Milestones" subtitle="Active deliveries">
          <div className="space-y-4">
            {MILESTONES.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{m.title}</p>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {m.due}</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">{m.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Messages */}
        <Panel title="Messages" subtitle="Contract-scoped chat">
          <MessagesPanel />
        </Panel>
      </div>
    </div>
  );
}
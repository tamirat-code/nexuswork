import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CheckCircle2, Clock, DollarSign, ArrowRight } from "lucide-react";
import { MOCK_CONTRACTS } from "../data/contracts";
import { useAuth } from "../context/AuthContext";

export default function ContractsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("active");

  const role = user?.role;
  const isStudent = role === "student";

  const myContracts = useMemo(() => {
    // In real app, filter by user.id. Mock: show all contracts but show appropriate "other party"
    return MOCK_CONTRACTS;
  }, []);

  const stats = useMemo(() => {
    const active = myContracts.filter(c => c.status === "active").length;
    const totalBudget = myContracts.reduce((s, c) => s + c.totalBudget, 0);
    const released = myContracts.reduce((s, c) =>
      s + c.milestones.filter(m => m.status === "released").reduce((a, m) => a + m.amount, 0), 0
    );
    const pendingWork = myContracts.reduce((s, c) =>
      s + c.milestones.filter(m => m.status === "delivered").length, 0
    );
    return { active, totalBudget, released, pendingWork };
  }, [myContracts]);

  const getOtherParty = (contract) => isStudent ? contract.client : contract.student;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Contracts</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          {isStudent ? "Active contracts and milestone deliveries." : "Projects you're hiring for."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Contracts" value={stats.active} icon={FileText} tone="blue" />
        <StatCard label="Total Budget" value={`$${stats.totalBudget}`} icon={DollarSign} tone="teal" />
        <StatCard label={isStudent ? "Earned" : "Paid Out"} value={`$${stats.released}`} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Awaiting Review" value={stats.pendingWork} icon={Clock} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
        {["active", "completed", "all"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Contract Cards */}
      <div className="space-y-4">
        {myContracts.map((contract) => {
          const other = getOtherParty(contract);
          const activeMs = contract.milestones.filter(m => m.status !== "released" && m.status !== "pending");
          const nextDue = contract.milestones.find(m => m.status === "in_progress" || m.status === "funded");
          const progress = Math.round(
            (contract.milestones.filter(m => m.status === "released").length / contract.milestones.length) * 100
          );

          return (
            <Link
              key={contract.id}
              to={`/contracts/${contract.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-500/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                    <span className="text-xs text-slate-400">#{contract.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {contract.title}
                  </h2>
                  <div className="mt-2 flex items-center gap-3 text-sm text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                        {other.name.charAt(0)}
                      </span>
                      {isStudent ? "Client: " : "Student: "}{other.name}
                    </span>
                    <span>•</span>
                    <span>Started {contract.startDate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">${contract.totalBudget}</p>
                  <p className="mt-1 text-xs text-slate-400">{contract.milestones.length} milestones</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-zinc-300">
                    {activeMs.length > 0 ? `${activeMs.length} in progress` : "On track"}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">{progress}% complete</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {nextDue && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-600 dark:text-zinc-300">Next: {nextDue.title}</span>
                  </div>
                  <span className="text-xs text-slate-400">Due {nextDue.dueDate}</span>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end text-sm font-semibold text-blue-600 group-hover:gap-2 dark:text-blue-400">
                View contract <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Send, Wallet, PlusCircle, Sparkles } from "lucide-react";
import { StatCard, Panel, StatusBadge } from "../../components/dashboard/ui";
import DataTable from "../../components/dashboard/DataTable";
import { ChartCard, EarningsAreaChart, ContractStatusPieChart } from "../../components/dashboard/charts";
import { useNotifications } from "../../context/NotificationContext";
import { platformRevenue, contractStatus } from "../../data/metrics";

const INITIAL_PROPOSALS = [
  { id: 1, student: "Selam M.", bid: 750, days: 14, rating: 4.9, match: 96, status: "open" },
  { id: 2, student: "Daniel T.", bid: 820, days: 12, rating: 4.8, match: 91, status: "open" },
  { id: 3, student: "Hanna K.", bid: 690, days: 18, rating: 5.0, match: 88, status: "open" },
  { id: 4, student: "Abel R.", bid: 900, days: 10, rating: 4.7, match: 84, status: "open" },
  { id: 5, student: "Meron A.", bid: 780, days: 15, rating: 4.6, match: 80, status: "open" },
];

const ACTIVITY = [
  { id: 1, text: "Selam M. submitted milestone 2", time: "2h ago" },
  { id: 2, text: "You funded milestone 3 ($450) into escrow", time: "6h ago" },
  { id: 3, text: "5 new proposals on 'Event Web App'", time: "1d ago" },
];

const INVOICES = [
  { id: "INV-1042", amount: "$450", date: "Aug 02", status: "released" },
  { id: "INV-1038", amount: "$300", date: "Jul 21", status: "released" },
  { id: "INV-1051", amount: "$450", date: "Aug 09", status: "pending" },
];

export default function ClientDashboard() {
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const { notify } = useNotifications();

  const decide = (ids, status) => {
    setProposals((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p)));
    notify(`${ids.length} proposal(s) ${status}`, status === "approved" ? "success" : "info");
  };

  const columns = [
    { key: "student", header: "Student", sortable: true, render: (r) => (
      <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-400 text-[10px] font-bold text-white">{r.student.charAt(0)}</span>
        {r.student}
      </span>
    ) },
    { key: "bid", header: "Bid", sortable: true, render: (r) => `$${r.bid}` },
    { key: "days", header: "Days", sortable: true },
    { key: "rating", header: "Rating", sortable: true, render: (r) => `⭐ ${r.rating}` },
    { key: "match", header: "AI Match", sortable: true, render: (r) => (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-300"><Sparkles className="h-3 w-3" />{r.match}%</span>
    ) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Client Workspace</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Hiring, escrow, and contract oversight.</p>
        </div>
        <Link to="/projects/new" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25">
          <PlusCircle className="h-4 w-4" /> Post a Project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Active projects" value="3" hint="1 closing soon" tone="blue" />
        <StatCard icon={Send} label="Open proposals" value={proposals.filter((p) => p.status === "open").length} hint="5 this week" tone="indigo" />
        <StatCard icon={Wallet} label="In escrow" value="$900" hint="2 funded milestones" tone="teal" />
        <StatCard icon={Wallet} label="Total spent" value="$2,400" hint="This quarter" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Spend trend" subtitle="Monthly released payments (USD)">
            <EarningsAreaChart data={platformRevenue} dataKey="revenue" color="#4f46e5" />
          </ChartCard>
        </div>
        <ChartCard title="Contract status" subtitle="All-time distribution">
          <ContractStatusPieChart data={contractStatus} />
        </ChartCard>
      </div>

      <Panel title="Proposal comparison" subtitle="Select rows to accept or decline in bulk">
        <DataTable
          columns={columns}
          data={proposals}
          searchableKeys={["student"]}
          pageSize={4}
          selectable
          exportName="proposals"
          bulkActions={[
            { label: "Accept", onClick: (ids) => decide(ids, "approved") },
            { label: "Decline", tone: "danger", onClick: (ids) => decide(ids, "rejected") },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Activity timeline" subtitle="Latest workspace events">
          <ol className="relative space-y-5 border-l border-slate-200 pl-5 dark:border-white/10">
            {ACTIVITY.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-slate-950" />
                <p className="text-sm text-slate-700 dark:text-zinc-200">{a.text}</p>
                <p className="text-xs text-slate-400">{a.time}</p>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Invoices" subtitle="Payment history & statements">
          <div className="space-y-3">
            {INVOICES.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-white/5">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{i.id}</p>
                  <p className="text-xs text-slate-400">{i.date} · {i.amount}</p>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI candidate ranking" subtitle="Best matches for your open projects">
          <div className="space-y-3">
            {[...INITIAL_PROPOSALS].sort((a, b) => b.match - a.match).slice(0, 3).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-lg font-black text-slate-300 dark:text-zinc-600">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.student}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" style={{ width: `${p.match}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-300">{p.match}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
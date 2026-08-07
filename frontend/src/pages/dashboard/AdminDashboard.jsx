import { useState } from "react";
import { Users, Briefcase, Wallet, Scale, ShieldAlert } from "lucide-react";
import { StatCard, Panel, StatusBadge } from "../../components/dashboard/ui";
import DataTable from "../../components/dashboard/DataTable";
import { ChartCard, GrowthLineChart, EarningsAreaChart } from "../../components/dashboard/charts";
import { useNotifications } from "../../context/NotificationContext";
import { userGrowth, platformRevenue } from "../../data/metrics";

const INITIAL_USERS = [
  { id: 1, name: "Selam M.", email: "selam@aau.edu.et", role: "student", status: "active", joined: "2026-06-12" },
  { id: 2, name: "Daniel T.", email: "daniel@techcorp.com", role: "client", status: "active", joined: "2026-06-20" },
  { id: 3, name: "Kaleb W.", email: "kaleb@aau.edu.et", role: "student", status: "suspended", joined: "2026-07-01" },
  { id: 4, name: "Dr. Sara N.", email: "sara@aau.edu.et", role: "university_staff", status: "active", joined: "2026-06-05" },
  { id: 5, name: "Hanna K.", email: "hanna@bdu.edu.et", role: "student", status: "active", joined: "2026-07-15" },
  { id: 6, name: "Abel R.", email: "abel@ngo.org", role: "client", status: "active", joined: "2026-07-22" },
];

const AUDIT_LOG = [
  { id: 1, actor: "admin@nexuswork.io", action: "Suspended user Kaleb W.", time: "Aug 06, 14:12" },
  { id: 2, actor: "system", action: "Released $450 escrow → Selam M. (milestone 2)", time: "Aug 06, 09:40" },
  { id: 3, actor: "sara@aau.edu.et", action: "Approved verification: Bemnet T.", time: "Aug 05, 16:22" },
];

const FRAUD_ALERTS = [
  { id: 1, target: "Proposal #881", reason: "Duplicate bid pattern across 3 accounts", status: "disputed" },
  { id: 2, target: "Account u-7741", reason: "Rapid login attempts from 4 IPs", status: "pending" },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const { notify } = useNotifications();

  const suspend = (ids) => {
    setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, status: "suspended" } : u)));
    notify(`${ids.length} user(s) suspended`, "error");
  };
  const activate = (ids) => {
    setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, status: "active" } : u)));
    notify(`${ids.length} user(s) activated`, "success");
  };

  const columns = [
    { key: "name", header: "Name", sortable: true, render: (r) => <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span> },
    { key: "email", header: "Email", sortable: true },
    { key: "role", header: "Role", sortable: true, render: (r) => <span className="capitalize">{r.role.replace("_", " ")}</span> },
    { key: "joined", header: "Joined", sortable: true },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "suspended" ? "rejected" : "active"} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Platform Administration</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Oversight, revenue, security, and user management.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total users" value="1,842" hint="+96 this month" tone="blue" />
        <StatCard icon={Wallet} label="Gross volume" value="$48,200" hint="Escrow + released" tone="teal" />
        <StatCard icon={Briefcase} label="Active projects" value="214" tone="indigo" />
        <StatCard icon={Scale} label="Open disputes" value="2" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="User growth" subtitle="Students vs clients">
          <GrowthLineChart data={userGrowth} lines={[{ key: "students", color: "#2563eb", name: "Students" }, { key: "clients", color: "#14b8a6", name: "Clients" }]} />
        </ChartCard>
        <ChartCard title="Platform revenue" subtitle="Commission income (USD)">
          <EarningsAreaChart data={platformRevenue} dataKey="revenue" color="#8b5cf6" />
        </ChartCard>
      </div>

      <Panel title="User management" subtitle="Search, filter, suspend or activate in bulk">
        <DataTable
          columns={columns}
          data={users}
          searchableKeys={["name", "email", "role"]}
          pageSize={5}
          selectable
          exportName="users"
          bulkActions={[
            { label: "Activate", onClick: activate },
            { label: "Suspend", tone: "danger", onClick: suspend },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Audit log" subtitle="Immutable administrative & financial trail">
          <div className="space-y-3 font-mono text-xs">
            {AUDIT_LOG.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-100 p-3 dark:border-white/5">
                <p className="text-slate-700 dark:text-zinc-200">{a.action}</p>
                <p className="mt-1 text-slate-400">{a.actor} · {a.time}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Fraud & security monitoring" subtitle="Automated risk flags">
          <div className="space-y-3">
            {FRAUD_ALERTS.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-red-200/60 bg-red-50/40 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{f.target}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{f.reason}</p>
                  </div>
                </div>
                <StatusBadge status={f.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
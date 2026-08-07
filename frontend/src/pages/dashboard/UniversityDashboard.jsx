import { useState } from "react";
import { ShieldCheck, GraduationCap, BadgeCheck, BarChart3 } from "lucide-react";
import { StatCard, Panel, StatusBadge } from "../../components/dashboard/ui";
import DataTable from "../../components/dashboard/DataTable";
import { ChartCard, GrowthLineChart, SkillDemandBarChart } from "../../components/dashboard/charts";
import { useNotifications } from "../../context/NotificationContext";
import { employmentRate, skillDemand } from "../../data/metrics";

const INITIAL_QUEUE = [
  { id: 1, student: "Meron A.", sid: "UGR/2211/14", program: "Software Eng, Yr 3", submitted: "2026-08-05", status: "pending" },
  { id: 2, student: "Abel R.", sid: "UGR/1987/13", program: "Computer Science, Yr 4", submitted: "2026-08-05", status: "pending" },
  { id: 3, student: "Liya T.", sid: "UGR/2450/15", program: "Information Systems, Yr 2", submitted: "2026-08-04", status: "pending" },
  { id: 4, student: "Samuel G.", sid: "UGR/1755/12", program: "Electrical Eng, Yr 5", submitted: "2026-08-03", status: "pending" },
];

const HISTORY = [
  { id: 1, student: "Bemnet T.", action: "Enrollment verified", date: "2026-07-28", status: "verified" },
  { id: 2, student: "Ruth M.", action: "React skill certified", date: "2026-07-25", status: "verified" },
  { id: 3, student: "Kaleb W.", action: "Verification rejected (ID mismatch)", date: "2026-07-22", status: "rejected" },
];

export default function UniversityDashboard() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const { notify } = useNotifications();

  const review = (ids, status) => {
    setQueue((prev) => prev.filter((q) => !ids.includes(q.id)));
    notify(`${ids.length} verification(s) ${status}`, status === "verified" ? "success" : "error");
  };

  const columns = [
    { key: "student", header: "Student", sortable: true, render: (r) => <span className="font-semibold text-slate-900 dark:text-white">{r.student}</span> },
    { key: "sid", header: "Student ID" },
    { key: "program", header: "Program" },
    { key: "submitted", header: "Submitted", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">University Administration</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Verification, certification, and employment outcomes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Pending verifications" value={queue.length} tone="amber" />
        <StatCard icon={GraduationCap} label="Verified students" value="342" tone="blue" />
        <StatCard icon={BadgeCheck} label="Skills certified" value="1,208" tone="teal" />
        <StatCard icon={BarChart3} label="Employment rate" value="68%" hint="Active freelancers" tone="indigo" />
      </div>

      <Panel title="Verification queue" subtitle="Bulk-approve or reject selected requests">
        <DataTable
          columns={columns}
          data={queue}
          searchableKeys={["student", "sid", "program"]}
          pageSize={4}
          selectable
          exportName="verification-queue"
          bulkActions={[
            { label: "Approve", onClick: (ids) => review(ids, "verified") },
            { label: "Reject", tone: "danger", onClick: (ids) => review(ids, "rejected") },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Graduate employment rate" subtitle="% of verified students earning on-platform">
          <GrowthLineChart data={employmentRate} lines={[{ key: "rate", color: "#14b8a6", name: "Employment %" }]} />
        </ChartCard>
        
        {/* ✅ FIXED TYPO HERE (was ChartChard) */}
        <ChartCard title="In-demand skills" subtitle="Among your student body">
          <SkillDemandBarChart data={skillDemand} />
        </ChartCard>
      </div>

      <Panel title="Verification history" subtitle="Recent decisions">
        <div className="space-y-3">
          {HISTORY.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-white/5">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{h.student}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{h.action} · {h.date}</p>
              </div>
              <StatusBadge status={h.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
import { TrendingUp, Users, DollarSign, Briefcase, Download } from "lucide-react";
import { ChartCard, EarningsAreaChart, GrowthLineChart } from "../components/dashboard/charts";
import DataTable from "../components/dashboard/DataTable";

const MONTHLY_STATS = [
  { month: "Mar", users: 520, revenue: 12400, projects: 89 },
  { month: "Apr", users: 644, revenue: 18500, projects: 112 },
  { month: "May", users: 815, revenue: 24000, projects: 145 },
  { month: "Jun", users: 1022, revenue: 31000, projects: 178 },
  { month: "Jul", users: 1251, revenue: 43000, projects: 214 },
  { month: "Aug", users: 1460, revenue: 54000, projects: 247 },
];

const TOP_STUDENTS = [
  { name: "Selam M.", earnings: 8420, projects: 12, rating: 4.9 },
  { name: "Daniel T.", earnings: 7800, projects: 15, rating: 4.8 },
  { name: "Meron A.", earnings: 6200, projects: 9, rating: 4.9 },
  { name: "Abel R.", earnings: 5100, projects: 8, rating: 4.7 },
];

export default function ReportsPage() {
  const columns = [
    { key: "name", header: "Student", sortable: true },
    { key: "earnings", header: "Earnings", sortable: true, render: (r) => `$${r.earnings.toLocaleString()}` },
    { key: "projects", header: "Projects", sortable: true },
    { key: "rating", header: "Rating", sortable: true, render: (r) => `⭐ ${r.rating}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Platform Reports</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Analytics and insights across the platform.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
          <Download className="h-4 w-4" /> Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Total Users" value="1,460" icon={Users} trend="+12%" />
        <StatBox label="Monthly Revenue" value="$54,000" icon={DollarSign} trend="+26%" />
        <StatBox label="Active Projects" value="247" icon={Briefcase} trend="+15%" />
        <StatBox label="Avg. Project Value" value="$820" icon={TrendingUp} trend="+8%" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Platform Growth" subtitle="User acquisition over time">
          <GrowthLineChart
            data={MONTHLY_STATS}
            lines={[
              { key: "users", color: "#2563eb", name: "Users" },
              { key: "projects", color: "#14b8a6", name: "Projects" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Revenue Trend" subtitle="Monthly platform revenue (USD)">
          <EarningsAreaChart data={MONTHLY_STATS} dataKey="revenue" color="#14b8a6" />
        </ChartCard>
      </div>

      {/* Top Performers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Top Performing Students</h2>
        <DataTable columns={columns} data={TOP_STUDENTS} pageSize={4} />
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, trend }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <Icon className="h-4 w-4 text-blue-500" />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      {trend && <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{trend} this month</p>}
    </div>
  );
}
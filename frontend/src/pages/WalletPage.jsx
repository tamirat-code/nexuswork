import { useState } from "react";
import { Wallet, TrendingUp, DollarSign, Clock, Download, ArrowUpRight, ArrowDownLeft, ShieldCheck, Search, FileText } from "lucide-react";
import { StatCard, Panel, StatusBadge } from "../components/dashboard/ui";
import DataTable from "../components/dashboard/DataTable";
import { ChartCard, EarningsAreaChart } from "../components/dashboard/charts";
import WithdrawModal from "../components/wallet/WithdrawModal";
import { WALLET_BALANCE, MONTHLY_EARNINGS, TRANSACTIONS, INVOICES } from "../data/wallet";

const TYPE_CONFIG = {
  released: { icon: ArrowDownLeft, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  escrow: { icon: ShieldCheck, color: "text-teal-500", bg: "bg-teal-500/10" },
  withdrawal: { icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-500/10" },
  fee: { icon: DollarSign, color: "text-slate-500", bg: "bg-slate-500/10" },
  refund: { icon: ArrowDownLeft, color: "text-amber-500", bg: "bg-amber-500/10" },
};

export default function WalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions");

  const columns = [
    {
      key: "title",
      header: "Transaction",
      sortable: true,
      render: (r) => {
        const Icon = TYPE_CONFIG[r.type].icon;
        return (
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TYPE_CONFIG[r.type].bg}`}>
              <Icon className={`h-4 w-4 ${TYPE_CONFIG[r.type].color}`} />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{r.title}</p>
              <p className="text-xs text-slate-400">{r.id}{r.client ? ` · ${r.client}` : ""}</p>
            </div>
          </div>
        );
      },
    },
    { key: "date", header: "Date", sortable: true },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (r) => (
        <span className={`font-bold ${r.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {r.amount >= 0 ? "+" : ""}${Math.abs(r.amount).toFixed(2)}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "completed" ? "approved" : r.status === "held" ? "funded" : "pending"} /> },
  ];

  const invoiceColumns = [
    { key: "id", header: "Invoice #", sortable: true },
    { key: "client", header: "Client", sortable: true },
    { key: "project", header: "Project" },
    { key: "milestone", header: "Milestone" },
    { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-bold text-slate-900 dark:text-white">${r.amount}</span> },
    { key: "date", header: "Date", sortable: true },
    { key: "status", header: "Status", render: () => <StatusBadge status="released" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Wallet & Payments</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Your earnings, transactions, and invoices.</p>
        </div>
        <button
          onClick={() => setWithdrawOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl"
        >
          <ArrowUpRight className="h-4 w-4" /> Withdraw Money
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Available Balance" value={`$${WALLET_BALANCE.available.toFixed(2)}`} hint="Ready to withdraw" tone="blue" />
        <StatCard icon={ShieldCheck} label="In Escrow" value={`$${WALLET_BALANCE.escrow.toFixed(2)}`} hint="Protected funds" tone="teal" />
        <StatCard icon={Clock} label="Pending" value={`$${WALLET_BALANCE.pending.toFixed(2)}`} hint="Awaiting approval" tone="amber" />
        <StatCard icon={TrendingUp} label="Lifetime Earnings" value={`$${WALLET_BALANCE.lifetimeEarnings.toLocaleString()}`} hint="Since Jan 2024" tone="indigo" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Earnings" subtitle="Income vs expenses (USD)">
          <EarningsAreaChart data={MONTHLY_EARNINGS} dataKey="earnings" color="#14b8a6" />
        </ChartCard>
        <Panel title="Escrow Summary" subtitle="Protected funds at a glance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-zinc-400">Total active contracts</span>
              <span className="font-bold text-slate-900 dark:text-white">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-zinc-400">Released this month</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">$500.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-zinc-400">Average milestone</span>
              <span className="font-bold text-slate-900 dark:text-white">$316.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-zinc-400">Next expected release</span>
              <span className="font-bold text-slate-900 dark:text-white">Aug 25</span>
            </div>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">100% escrow protected</p>
              </div>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">All active funds held safely by university-verified partners.</p>
            </div>
          </div>
        </Panel>
      </div>

      {/* Tabs: Transactions / Invoices */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
        {[
          { id: "transactions", label: "Transaction History", count: TRANSACTIONS.length },
          { id: "invoices", label: "Invoices", count: INVOICES.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <Panel title="All Transactions" subtitle="Search, filter, and export your payment history">
          <DataTable
            columns={columns}
            data={TRANSACTIONS}
            searchableKeys={["title", "id", "client"]}
            pageSize={5}
            exportName="wallet-transactions"
          />
        </Panel>
      )}

      {activeTab === "invoices" && (
        <Panel
          title="Invoices"
          subtitle="Generated automatically for each approved milestone"
          action={
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
              <Download className="h-3.5 w-3.5" /> Export All
            </button>
          }
        >
          <DataTable
            columns={invoiceColumns}
            data={INVOICES}
            searchableKeys={["id", "client", "project"]}
            pageSize={5}
            exportName="invoices"
          />
        </Panel>
      )}

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableBalance={WALLET_BALANCE.available}
      />
    </div>
  );
}
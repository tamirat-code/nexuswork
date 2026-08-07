import { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, FileText } from "lucide-react";
import DataTable from "../components/dashboard/DataTable";
import { useNotifications } from "../context/NotificationContext";
import { MOCK_DISPUTES } from "../data/disputes";

const STATUS_COLORS = {
  open: "bg-red-500/10 text-red-600 dark:text-red-400",
  under_review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const PRIORITY_COLORS = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-slate-600 dark:text-zinc-400",
};

export default function DisputesPage() {
  const { notify } = useNotifications();
  const [disputes, setDisputes] = useState(MOCK_DISPUTES);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const resolveDispute = (id, resolution) => {
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: "resolved", resolution } : d));
    notify(`Dispute ${id} resolved: ${resolution}`, "success");
    setSelectedDispute(null);
  };

  const columns = [
    { key: "id", header: "ID", sortable: true },
    { key: "contract", header: "Contract", sortable: true },
    {
      key: "parties",
      header: "Parties",
      render: (r) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900 dark:text-white">{r.student} vs {r.client}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", sortable: true, render: (r) => `$${r.amount}` },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[r.status]}`}>
          {r.status.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (r) => <span className={`text-xs font-bold uppercase ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>,
    },
    { key: "opened", header: "Opened", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Dispute Resolution</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Manage contract disputes and mediate between parties.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Open Disputes" value={disputes.filter(d => d.status === "open").length} icon={AlertCircle} color="text-red-500" />
        <StatBox label="Under Review" value={disputes.filter(d => d.status === "under_review").length} icon={Clock} color="text-amber-500" />
        <StatBox label="Resolved" value={disputes.filter(d => d.status === "resolved").length} icon={CheckCircle2} color="text-emerald-500" />
        <StatBox label="Total Amount" value={`$${disputes.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`} icon={FileText} color="text-blue-500" />
      </div>

      {/* Disputes Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          data={disputes}
          searchableKeys={["id", "contract", "student", "client"]}
          pageSize={5}
          onRowClick={(dispute) => setSelectedDispute(dispute)}
        />
      </div>

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <DisputeModal
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onResolve={resolveDispute}
        />
      )}
    </div>
  );
}

function DisputeModal({ dispute, onClose, onResolve }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dispute {dispute.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Contract</p>
              <p className="font-semibold text-slate-900 dark:text-white">{dispute.contract}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Amount in Dispute</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">${dispute.amount}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Student</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{dispute.student}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">{dispute.studentClaim}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">Client</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{dispute.client}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">{dispute.clientClaim}</p>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Evidence Files</p>
            <div className="flex flex-wrap gap-2">
              {dispute.evidence.map((file, i) => (
                <span key={i} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-zinc-300">
                  <FileText className="h-3 w-3" /> {file}
                </span>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div>
            <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">Conversation</p>
            <div className="space-y-2">
              {dispute.messages.map((msg, i) => (
                <div key={i} className={`rounded-lg p-3 ${msg.from === "admin" ? "bg-blue-50 dark:bg-blue-500/10" : "bg-slate-50 dark:bg-white/5"}`}>
                  <p className="text-xs font-bold capitalize text-slate-500 dark:text-zinc-400">{msg.from}</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-zinc-300">{msg.text}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{msg.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Actions */}
          {dispute.status !== "resolved" && (
            <div className="border-t border-slate-200 pt-6 dark:border-white/10">
              <p className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Resolution Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onResolve(dispute.id, "release_to_student")}
                  className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Release to Student
                </button>
                <button
                  onClick={() => onResolve(dispute.id, "refund_to_client")}
                  className="rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                >
                  Refund to Client
                </button>
                <button
                  onClick={() => onResolve(dispute.id, "split_50_50")}
                  className="col-span-2 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
                >
                  Split 50/50
                </button>
              </div>
            </div>
          )}

          {dispute.status === "resolved" && (
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Resolved: {dispute.resolution?.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{label}</p>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
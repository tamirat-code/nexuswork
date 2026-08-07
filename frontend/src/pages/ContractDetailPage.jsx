import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, FileText, MessageSquare, Users } from "lucide-react";
import { MOCK_CONTRACTS } from "../data/contracts";
import { useAuth } from "../context/AuthContext";
import MilestoneTracker from "../components/marketplace/MilestoneTracker";

export default function ContractDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState(() => MOCK_CONTRACTS.find(c => c.id === id));
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, from: "client", text: "Looking forward to working with you!", time: "Jul 15" },
    { id: 2, from: "student", text: "Same here! I'll start on milestone 1 today.", time: "Jul 15" },
  ]);

  if (!contract) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contract not found</h2>
          <Link to="/contracts" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to contracts
          </Link>
        </div>
      </div>
    );
  }

  const role = user?.role === "client" ? "client" : "student";
  const other = role === "student" ? contract.client : contract.student;

  const updateMilestone = (milestoneId, newStatus, extra = {}) => {
    setContract(prev => ({
      ...prev,
      milestones: prev.milestones.map(m =>
        m.id === milestoneId ? { ...m, status: newStatus, ...extra } : m
      ),
    }));
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), from: role, text: message.trim(), time: "now" }]);
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <Link to="/contracts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
        <ArrowLeft className="h-4 w-4" /> Back to Contracts
      </Link>

      {/* Contract Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Active Contract
              </span>
              <span className="text-xs text-slate-400">#{contract.id}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{contract.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {role === "student" ? "Client: " : "Student: "}{other.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {contract.startDate} → {contract.endDate}
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> ${contract.totalBudget} total
              </span>
            </div>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">
            {other.name.charAt(0)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Milestone Tracker */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Milestones</h2>
          <MilestoneTracker
            milestones={contract.milestones}
            onUpdate={updateMilestone}
            role={role}
          />
        </div>

        {/* Sidebar: Contract Chat */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <MessageSquare className="h-4 w-4" /> Contract Chat
            </h3>
            <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === role ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    m.from === role
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-zinc-200"
                  }`}>
                    <p>{m.text}</p>
                    <p className={`mt-1 text-[9px] ${m.from === role ? "text-blue-100" : "text-slate-400"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              />
              <button
                onClick={sendMessage}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contract Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Milestones</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-200">{contract.milestones.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Payment method</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Escrow ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Dispute window</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-200">72 hours</span>
              </div>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
              <FileText className="h-3.5 w-3.5" /> Download Contract PDF
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
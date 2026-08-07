import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Clock, Upload, DollarSign, AlertCircle, FileText,
  XCircle, CheckCircle2, Loader2, Calendar, Send, MessageSquare,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const STATUS_CONFIG = {
  pending:   { color: "slate",    icon: Clock,        label: "Pending" },
  funded:    { color: "teal",     icon: DollarSign,   label: "Funded in Escrow" },
  in_progress:{ color: "blue",    icon: Loader2,      label: "In Progress" },
  delivered: { color: "indigo",   icon: Send,         label: "Delivered — Awaiting Approval" },
  approved:  { color: "emerald",  icon: CheckCircle2, label: "Approved" },
  released:  { color: "emerald",  icon: CheckCircle2, label: "Paid" },
  disputed:  { color: "red",      icon: AlertCircle,  label: "Disputed" },
};

const COLOR_MAP = {
  slate:   { bg: "bg-slate-100 dark:bg-slate-700",   text: "text-slate-600 dark:text-slate-300",   ring: "ring-slate-200 dark:ring-slate-700" },
  teal:    { bg: "bg-teal-500",                       text: "text-teal-700 dark:text-teal-300",      ring: "ring-teal-200 dark:ring-teal-800" },
  blue:    { bg: "bg-blue-500",                       text: "text-blue-700 dark:text-blue-300",      ring: "ring-blue-200 dark:ring-blue-800" },
  indigo:  { bg: "bg-indigo-500",                     text: "text-indigo-700 dark:text-indigo-300",  ring: "ring-indigo-200 dark:ring-indigo-800" },
  emerald: { bg: "bg-emerald-500",                    text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-800" },
  red:     { bg: "bg-red-500",                        text: "text-red-700 dark:text-red-300",        ring: "ring-red-200 dark:ring-red-800" },
};

export default function MilestoneTracker({ milestones, onUpdate, role }) {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [uploadingId, setUploadingId] = useState(null);
  const [feedbackDraft, setFeedbackDraft] = useState({});

  const totalBudget = milestones.reduce((s, m) => s + m.amount, 0);
  const fundedAmount = milestones.filter(m => m.status !== "pending").reduce((s, m) => s + m.amount, 0);
  const releasedAmount = milestones.filter(m => m.status === "released").reduce((s, m) => s + m.amount, 0);
  const fundedPercent = Math.round((fundedAmount / totalBudget) * 100);

  // Role-based actions
  const startWork = (id) => {
    onUpdate(id, "in_progress");
    notify("Work started! Upload deliverable when ready.", "success");
  };

  const submitWork = async (id) => {
    setUploadingId(id);
    await new Promise(r => setTimeout(r, 1200)); // simulate upload
    setUploadingId(null);
    onUpdate(id, "delivered", { deliverable: "deliverable.zip", submittedAt: new Date().toISOString().split("T")[0] });
    notify("Work submitted for client review.", "success");
  };

  const approveMilestone = (id) => {
    onUpdate(id, "released", { approvedAt: new Date().toISOString().split("T")[0] });
    notify("Milestone approved — funds released to student!", "success");
  };

  const rejectMilestone = (id) => {
    const feedback = feedbackDraft[id];
    if (!feedback?.trim()) {
      notify("Please provide feedback explaining what needs revision.", "error");
      return;
    }
    onUpdate(id, "in_progress", { feedback });
    notify("Revision requested. Student has been notified.", "info");
    setFeedbackDraft(p => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Escrow Progress Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Escrow Protection</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              ${releasedAmount} <span className="text-sm font-semibold text-slate-400">of ${totalBudget}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Funded</p>
            <p className="mt-1 text-2xl font-extrabold text-teal-600 dark:text-teal-400">${fundedAmount}</p>
          </div>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fundedPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-zinc-500">
          <span>Released: ${releasedAmount}</span>
          <span>{fundedPercent}% protected</span>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const config = STATUS_CONFIG[milestone.status];
          const colors = COLOR_MAP[config.color];
          const Icon = config.icon;
          const isLast = index === milestones.length - 1;

          // Determine which action to show based on role + status
          const canStartWork = role === "student" && milestone.status === "funded";
          const canSubmitWork = role === "student" && milestone.status === "in_progress";
          const canApprove = role === "client" && milestone.status === "delivered";

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative"
            >
              <div className="flex gap-4">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors.bg} ${milestone.status === "released" || milestone.status === "approved" ? "text-white" : "text-white"} ring-4 ${colors.ring}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {!isLast && (
                    <div className={`mt-2 h-full w-0.5 flex-1 ${milestone.status === "released" ? "bg-emerald-300 dark:bg-emerald-700" : "bg-slate-200 dark:bg-white/10"}`} />
                  )}
                </div>

                {/* Content card */}
                <div className="flex-1 pb-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                    {/* Header */}
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">
                            Milestone {index + 1}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${colors.bg} text-white`}>
                            {config.label}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {milestone.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">${milestone.amount}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500">
                          <Calendar className="h-3 w-3" /> Due {milestone.dueDate}
                        </p>
                      </div>
                    </div>

                    {/* Status-specific details */}
                    {milestone.deliverable && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 text-slate-700 dark:text-zinc-200">{milestone.deliverable}</span>
                        <span className="text-xs text-slate-400">Submitted {milestone.submittedAt}</span>
                      </div>
                    )}

                    {milestone.feedback && (
                      <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Client Feedback</p>
                          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">{milestone.feedback}</p>
                        </div>
                      </div>
                    )}

                    {milestone.approvedAt && (
                      <p className="mb-3 text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ Approved and paid on {milestone.approvedAt}
                      </p>
                    )}

                    {/* Role-based action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {canStartWork && (
                        <button
                          onClick={() => startWork(milestone.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <Clock className="h-3.5 w-3.5" /> Start Work
                        </button>
                      )}

                      {canSubmitWork && (
                        <button
                          onClick={() => submitWork(milestone.id)}
                          disabled={uploadingId === milestone.id}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {uploadingId === milestone.id ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="h-3.5 w-3.5" /> Submit Deliverable</>
                          )}
                        </button>
                      )}

                      {canApprove && (
                        <>
                          <button
                            onClick={() => approveMilestone(milestone.id)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Release ${milestone.amount}
                          </button>
                          <button
                            onClick={() => rejectMilestone(milestone.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Request Revision
                          </button>
                        </>
                      )}
                    </div>

                    {/* Client feedback input for delivered milestones */}
                    {canApprove && (
                      <div className="mt-3">
                        <textarea
                          rows="2"
                          value={feedbackDraft[milestone.id] || ""}
                          onChange={(e) => setFeedbackDraft(p => ({ ...p, [milestone.id]: e.target.value }))}
                          placeholder="Optional: feedback for revision (required if rejecting)..."
                          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
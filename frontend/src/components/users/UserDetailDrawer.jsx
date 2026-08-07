import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, AlertTriangle, DollarSign, Briefcase, ShieldCheck, UserX, UserCheck } from "lucide-react";

const ROLE_COLORS = {
  student: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  client: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  university_staff: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  admin: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_COLORS = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function UserDetailDrawer({ user, onClose, onUpdateStatus }) {
  if (!user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl dark:bg-slate-900"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h2>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
                {user.name.charAt(0)}
              </div>
              <h3 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400">{user.email}</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${ROLE_COLORS[user.role]}`}>
                  {user.role.replace("_", " ")}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_COLORS[user.status]}`}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Verification Status */}
            <div className={`rounded-xl p-4 ${user.verified ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
              <div className="flex items-center gap-2">
                {user.verified ? <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                <p className={`text-sm font-bold ${user.verified ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                  {user.verified ? "Identity Verified" : "Pending Verification"}
                </p>
              </div>
              {!user.verified && (
                <button className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700">
                  Review Verification Documents
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Joined</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                  <Calendar className="h-3.5 w-3.5" /> {user.joined}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                <p className="text-xs text-slate-500 dark:text-zinc-400">Projects</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                  <Briefcase className="h-3.5 w-3.5" /> {user.projects || 0}
                </p>
              </div>
              {user.role === "student" && (
                <div className="col-span-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Total Earnings</p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="h-4 w-4" /> {user.earnings.toLocaleString()}
                  </p>
                </div>
              )}
              {user.role === "client" && (
                <div className="col-span-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Total Spent</p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-blue-600 dark:text-blue-400">
                    <DollarSign className="h-4 w-4" /> {user.spent.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Suspension Reason */}
            {user.status === "suspended" && user.reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <p className="text-xs font-bold uppercase text-red-600 dark:text-red-400">Suspension Reason</p>
                <p className="mt-1 text-sm text-red-800 dark:text-red-200">{user.reason}</p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="space-y-2 border-t border-slate-200 pt-6 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Admin Actions</p>
              
              {user.status === "suspended" ? (
                <button 
                  onClick={() => onUpdateStatus(user.id, "active")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <UserCheck className="h-4 w-4" /> Reactivate Account
                </button>
              ) : (
                <button 
                  onClick={() => onUpdateStatus(user.id, "suspended")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <UserX className="h-4 w-4" /> Suspend Account
                </button>
              )}

              <button className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
                View Audit Log
              </button>
              <button className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
                Impersonate User
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import { useState } from "react";
import { ShieldCheck, Monitor, Smartphone, LogOut } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const MOCK_SESSIONS = [
  { id: 1, device: "MacBook Pro · Chrome", location: "Addis Ababa, ET", ip: "196.188.x.x", current: true, icon: Monitor },
  { id: 2, device: "iPhone 14 · Safari", location: "Addis Ababa, ET", ip: "196.188.x.x", current: false, icon: Smartphone },
];

export default function SecuritySettings() {
  const { notify } = useNotifications();
  const [twoFa, setTwoFa] = useState(true);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const revokeSession = (id) => {
    setSessions((s) => s.filter((sess) => sess.id !== id));
    notify("Session revoked successfully.", "success");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Manage your password and account security.</p>
      </div>

      {/* Change Password */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Change Password</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="password" placeholder="Current password" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
          <input type="password" placeholder="New password" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
        </div>
        <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
          Update Password
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5" />

      {/* 2FA */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Add an extra layer of security to your account.</p>
          </div>
        </div>
        <button
          onClick={() => { setTwoFa(!twoFa); notify(`2FA ${!twoFa ? "enabled" : "disabled"}`, "success"); }}
          className={`relative h-6 w-11 rounded-full transition-colors ${twoFa ? "bg-blue-600" : "bg-slate-300 dark:bg-zinc-600"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${twoFa ? "left-5" : "left-0.5"}`} />
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-white/5" />

      {/* Active Sessions */}
      <div>
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Active Sessions</h3>
        <div className="space-y-3">
          {sessions.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {s.device} {s.current && <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Current</span>}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{s.location} · {s.ip}</p>
                  </div>
                </div>
                {!s.current && (
                  <button onClick={() => revokeSession(s.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600">
                    <LogOut className="h-3.5 w-3.5" /> Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
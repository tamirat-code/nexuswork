import { useState } from "react";

const INITIAL_PREFS = [
  { id: "proposal", label: "New Proposals", desc: "When a student applies to your project", email: true, app: true },
  { id: "milestone", label: "Milestone Updates", desc: "Work submitted, approved, or revisions requested", email: true, app: true },
  { id: "payment", label: "Payments & Escrow", desc: "Funds deposited, released, or withdrawn", email: true, app: true },
  { id: "message", label: "Direct Messages", desc: "New messages in contract chats", email: false, app: true },
  { id: "marketing", label: "Platform Updates", desc: "New features, newsletters, and promotions", email: false, app: false },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(INITIAL_PREFS);

  const toggle = (id, type) => {
    setPrefs((p) => p.map((pref) => (pref.id === id ? { ...pref, [type]: !pref[type] } : pref)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Choose what updates you want to receive.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Activity</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Email</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">In-App</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {prefs.map((pref) => (
              <tr key={pref.id}>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{pref.label}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{pref.desc}</p>
                </td>
                <td className="px-4 py-4 text-center">
                  <Toggle checked={pref.email} onChange={() => toggle(pref.id, "email")} />
                </td>
                <td className="px-4 py-4 text-center">
                  <Toggle checked={pref.app} onChange={() => toggle(pref.id, "app")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative mx-auto h-6 w-11 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-zinc-600"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
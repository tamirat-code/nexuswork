import { useState } from "react";
import { Camera, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: "Full-stack developer passionate about building clean, scalable web applications.",
    phone: "+251912345678",
    website: "https://selam-portfolio.dev",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    notify("Profile updated successfully!", "success");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">This information will be displayed on your public portfolio.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
            {form.name.charAt(0)}
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg dark:border-slate-900 dark:bg-white dark:text-slate-900">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.email}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Email cannot be changed</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <InputField label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <InputField label="Phone Number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="sm:col-span-2">
          <InputField label="Website / Portfolio URL" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">Bio</label>
          <textarea
            rows="4"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-400">{form.bio.length} / 250 characters</p>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-6 dark:border-white/5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-60"
        >
          {saving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
      />
    </div>
  );
}
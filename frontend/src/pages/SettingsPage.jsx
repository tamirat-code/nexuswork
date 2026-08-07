import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, Palette, CreditCard } from "lucide-react";
import ProfileSettings from "../components/settings/ProfileSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import NotificationSettings from "../components/settings/NotificationSettings";

const TABS = [
  { id: "profile", label: "Profile", icon: User, desc: "Your public info and bio" },
  { id: "security", label: "Security", icon: Shield, desc: "Password, 2FA, and sessions" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "Email and in-app alerts" },
  { id: "billing", label: "Billing", icon: CreditCard, desc: "Invoices and payment methods" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Manage your account preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        {/* Settings Sidebar */}
        <aside className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  isActive
                    ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{tab.label}</p>
                  <p className={`text-[11px] ${isActive ? "text-blue-500/80 dark:text-blue-400/80" : "text-slate-400 dark:text-zinc-500"}`}>
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Settings Content */}
        <div className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" && <ProfileSettings />}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "billing" && <BillingPlaceholder />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BillingPlaceholder() {
  return (
    <div className="flex h-64 items-center justify-center text-center">
      <div>
        <CreditCard className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-600" />
        <p className="mt-3 font-semibold text-slate-500 dark:text-zinc-400">Billing settings are managed in the Wallet module.</p>
      </div>
    </div>
  );
}
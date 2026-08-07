import { useState, useMemo } from "react";
import { Users, ShieldCheck, UserX, UserCheck } from "lucide-react";
import DataTable from "../components/dashboard/DataTable";
import UserDetailDrawer from "../components/users/UserDetailDrawer";
import { useNotifications } from "../context/NotificationContext";
import { MOCK_USERS } from "../data/users";

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

export default function UsersPage() {
  const { notify } = useNotifications();
  const [users, setUsers] = useState(MOCK_USERS);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter(u => u.role === roleFilter);
  }, [users, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    pending: users.filter(u => u.status === "pending").length,
    suspended: users.filter(u => u.status === "suspended").length,
  }), [users]);

  const handleStatusUpdate = (userId, newStatus) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setSelectedUser(prev => prev.id === userId ? { ...prev, status: newStatus } : prev);
    notify(`User status updated to ${newStatus}`, newStatus === "active" ? "success" : "error");
  };

  const bulkSuspend = (ids) => {
    setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, status: "suspended" } : u));
    notify(`${ids.length} user(s) suspended`, "error");
  };

  const bulkActivate = (ids) => {
    setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, status: "active" } : u));
    notify(`${ids.length} user(s) activated`, "success");
  };

  const columns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
            {r.name.charAt(0)}
          </span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
            <p className="text-xs text-slate-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (r) => (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${ROLE_COLORS[r.role]}`}>
          {r.role.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_COLORS[r.status]}`}>
          {r.status}
        </span>
      ),
    },
    { key: "joined", header: "Joined", sortable: true },
    {
      key: "verified",
      header: "Verified",
      render: (r) => r.verified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-slate-400">No</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Manage platform users, roles, and account statuses.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBox label="Total Users" value={stats.total} icon={Users} />
        <StatBox label="Active" value={stats.active} icon={UserCheck} color="text-emerald-500" />
        <StatBox label="Pending Verification" value={stats.pending} icon={ShieldCheck} color="text-amber-500" />
        <StatBox label="Suspended" value={stats.suspended} icon={UserX} color="text-red-500" />
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/[0.03]">
        {["all", "student", "client", "university_staff", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-colors sm:text-sm ${
              roleFilter === role
                ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white"
                : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            {role === "all" ? "All Roles" : role.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          data={filteredUsers}
          onRowClick={(user) => setSelectedUser(user)}
          searchableKeys={["name", "email"]}
          pageSize={6}
          selectable
          exportName="platform-users"
          bulkActions={[
            { label: "Activate", onClick: bulkActivate },
            { label: "Suspend", tone: "danger", onClick: bulkSuspend },
          ]}
        />
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onUpdateStatus={handleStatusUpdate}
      />
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color = "text-blue-500" }) {
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
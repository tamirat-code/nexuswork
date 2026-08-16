import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, Flag, Briefcase } from "lucide-react";
import { listAdminStats, listAdminUsers, listAdminDisputes } from "../../services/api/admin.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";

export default function AdminPage() {
  const { token } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => listAdminStats(token), enabled: !!token });
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listAdminUsers("?limit=10", token), enabled: !!token });
  const { data: disputesData, isLoading: disputesLoading } = useQuery({ queryKey: ["admin-disputes"], queryFn: () => listAdminDisputes("?limit=10", token), enabled: !!token });

  const stats = statsData?.data ?? {};
  const users = usersData?.data ?? [];
  const disputes = disputesData?.data ?? [];

  const statCards = [
    { label: "Active projects", value: stats.active_projects ?? 0, icon: Briefcase },
    { label: "Students", value: stats.students ?? 0, icon: Users },
    { label: "Open disputes", value: stats.open_disputes ?? 0, icon: Flag },
    { label: "Platform income", value: stats.income ? `$${stats.income.toLocaleString()}` : "$0", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Platform</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Admin</h1>
        <p className="mt-2 text-sm text-slate-300">Manage users, resolve disputes, and monitor platform health.</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <s.icon className="h-5 w-5 text-brass" />
              <p className="mt-3 font-mono text-2xl font-semibold text-slate">{statsLoading ? "…" : s.value}</p>
              <p className="text-xs text-slate-300">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent users</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {usersLoading && <TableRow><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!usersLoading && users.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-300">No users yet</TableCell></TableRow>}
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-semibold text-slate">{u.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{u.role?.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dispute queue</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Milestone</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {disputesLoading && <TableRow><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!disputesLoading && disputes.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-300">No disputes</TableCell></TableRow>}
                {disputes.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="text-sm text-slate-300">{d.milestone_id?.title || "Milestone"}</TableCell>
                    <TableCell><StatusBadge kind="dispute" status={d.status} showDot /></TableCell>
                    <TableCell className="text-right font-mono text-brass">${(d.amount ?? 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Users, Flag, Briefcase, GraduationCap, Plus } from "lucide-react";
import { listAdminStats, listAdminUsers, listAdminDisputes } from "../../services/api/admin.api.js";
import { listUniversities, createUniversity } from "../../services/api/universities.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";

function CreateUniversityDialog({ token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const create = useMutation({
    mutationFn: () => createUniversity({ name: name.trim(), domain: domain.trim() }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["universities"] });
      toast.success("University created");
      setName("");
      setDomain("");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not create university"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add university
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a university</DialogTitle>
          <DialogDescription>
            Students with a matching email domain can request identity verification against this institution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uni-name">Name</Label>
            <Input id="uni-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Addis Ababa University" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uni-domain">Email domain</Label>
            <Input id="uni-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="aau.edu.et" />
          </div>
        </div>
        <DialogFooter>
          <Button
            loading={create.isPending}
            disabled={!name.trim() || !domain.trim()}
            onClick={() => create.mutate()}
          >
            Create university
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const { token } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => listAdminStats(token), enabled: !!token });
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listAdminUsers("?limit=10", token), enabled: !!token });
  const { data: disputesData, isLoading: disputesLoading } = useQuery({ queryKey: ["admin-disputes"], queryFn: () => listAdminDisputes("?limit=10", token), enabled: !!token });
  const { data: universitiesData, isLoading: universitiesLoading } = useQuery({ queryKey: ["universities"], queryFn: () => listUniversities() });

  const stats = statsData?.data ?? {};
const users = Array.isArray(usersData?.data)
  ? usersData.data
  : usersData?.data?.users ?? [];

const disputes = Array.isArray(disputesData?.data)
  ? disputesData.data
  : disputesData?.data?.disputes ?? [];

const universities = universitiesData?.data ?? [];

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

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Universities</CardTitle>
            <CreateUniversityDialog token={token} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Domain</TableHead></TableRow></TableHeader>
              <TableBody>
                {universitiesLoading && <TableRow><TableCell colSpan={2}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!universitiesLoading && universities.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="py-8 text-center text-slate-300">No universities yet — add one to enable student verification.</TableCell></TableRow>
                )}
                {universities.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="flex items-center gap-2 font-semibold text-slate"><GraduationCap className="h-4 w-4 text-brass" /> {u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">{u.domain}</TableCell>
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
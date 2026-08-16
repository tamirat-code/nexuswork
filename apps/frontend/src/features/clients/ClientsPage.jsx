import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Mail } from "lucide-react";
import { listClients } from "../../services/api/clients.api.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/shadcn/avatar.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => listClients(`?search=${encodeURIComponent(search)}`),
  });
  const clients = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Client directory</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Organizations &amp; individual clients</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Verified employers posting projects through NexusWork escrow.</p>
      </header>
      <div className="mt-6 max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients, orgs, or sector…" />
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {error && <TableRow><TableCell colSpan={5} className="text-center text-brick">{error.message}</TableCell></TableRow>}
              {!isLoading && !error && clients.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-300">No clients found</TableCell></TableRow>
              )}
              {clients.map((c) => {
                const orgName = c.name || c.client_profile?.organization_name || "Client";
                return (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar><AvatarImage src={c.avatar} alt="" /><AvatarFallback>{orgName.slice(0, 2)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate">{orgName}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-300"><Mail className="h-3 w-3" /> {c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.client_profile?.is_organization ? <Badge variant="secondary"><Building2 className="h-3 w-3" /> Organization</Badge> : <Badge variant="outline">Individual</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">{c.client_profile?.sector || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-slate-300">{c.projects_count ?? 0}</TableCell>
                    <TableCell className="text-right font-mono text-brass">{c.total_spent ? `$${c.total_spent.toLocaleString()}` : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

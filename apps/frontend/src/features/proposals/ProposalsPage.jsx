import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";
import { listMyProposals, withdrawProposal } from "../../services/api/proposals.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/shadcn/dialog.jsx";
import { ROLES } from "../../constants/roles.constants.js";
import { PROPOSAL_STATUS } from "../../constants/status.constants.js";

function EmptyProposals() {
  return (
    <Card className="px-6 py-16 text-center">
      <FileText className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-4 font-display text-lg text-slate">No proposals yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
        Browse open projects and submit a proposal with your price and timeline.
      </p>
      <Link to="/projects" className="mt-6 inline-block">
        <Button>Browse projects</Button>
      </Link>
    </Card>
  );
}

export default function ProposalsPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const isClient = user?.role === ROLES.CLIENT;

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-proposals"],
    queryFn: () => listMyProposals(token),
    enabled: !!token,
  });

  const withdrawMutation = useMutation({
    mutationFn: (id) => withdrawProposal(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-proposals"] });
      toast.success("Proposal withdrawn");
    },
    onError: (err) => toast.error(err.message || "Could not withdraw proposal"),
  });

  const proposals = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-display text-lg text-slate">Couldn't load proposals</h2>
        <p className="mt-2 text-sm text-slate-300">{error.message}</p>
      </Card>
    );
  }

  if (proposals.length === 0) return <EmptyProposals />;

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-5">
        <div>
          <h1 className="font-display text-2xl leading-tight tracking-tight text-slate">
            {isClient ? "Incoming proposals" : "My proposals"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            {proposals.length} proposal{proposals.length === 1 ? "" : "s"} total
          </p>
        </div>
        {!isClient && (
          <Link to="/projects">
            <Button variant="secondary" size="sm">Find more projects</Button>
          </Link>
        )}
      </header>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isClient ? "Student" : "Project"}</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                {!isClient && <TableHead className="w-16" aria-label="Actions" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    {isClient ? (
                      <div>
                        <p className="font-semibold text-slate">{p.student_id?.name || "Student"}</p>
                        <Badge variant="secondary" className="mt-0.5">University verified</Badge>
                      </div>
                    ) : (
                      <Link to={`/projects/${p.project_id?._id}`} className="font-semibold text-slate hover:text-brass">
                        {p.project_id?.title || "Project"}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-brass">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{p.delivery_time_days}d</TableCell>
                  <TableCell><StatusBadge kind="proposal" status={p.status} showDot /></TableCell>
                  <TableCell className="text-right text-sm text-slate-300">{formatDate(p.createdAt)}</TableCell>
                  {!isClient && p.status === PROPOSAL_STATUS.PENDING && (
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-brick" aria-label="Withdraw proposal">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Withdraw this proposal?</DialogTitle>
                            <DialogDescription>
                              The client will no longer see your proposal. You can submit a new one later.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="danger" size="sm" loading={withdrawMutation.isPending}
                              onClick={() => withdrawMutation.mutate(p._id)}>
                              Withdraw
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

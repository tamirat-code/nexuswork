import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { listAuditLogs, getAuditSummary, flagAuditLog } from "../../services/api/audit-logs.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";

const PAGE_SIZE = 25;

const ENTITY_TYPES = ["user", "contract", "dispute", "payment", "verification", "project", "proposal", "milestone", "submission"];
const ACTION_TYPES = [
  "user_suspended", "user_restored", "user_deleted", "dispute_resolved", "payment_reversed",
  "payment_adjusted", "contract_terminated", "verification_approved", "verification_rejected",
  "user_role_changed", "commission_adjusted", "content_removed", "fraud_reported",
  "login_via_admin", "settings_changed", "payment_deposit_initiated", "payment_deposit_succeeded",
  "payment_deposit_failed", "payment_released", "payment_release_failed", "payment_refunded",
  "payment_commission_recorded", "milestone_work_submitted", "milestone_revision_requested",
];

function FlagDialog({ token, entryId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const flag = useMutation({
    mutationFn: () => flagAuditLog(entryId, reason.trim(), token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-audit-logs"] });
      toast.success("Entry flagged for review");
      setReason("");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not flag this entry"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 gap-1.5">
          <Flag className="h-3.5 w-3.5" /> Flag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Flag entry for review</DialogTitle>
          <DialogDescription>Marks this audit entry for manual follow-up.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="flag-reason">Reason</Label>
          <Textarea
            id="flag-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Unusual commission adjustment, needs a second pair of eyes."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button loading={flag.isPending} disabled={!reason.trim()} onClick={() => flag.mutate()}>
            Flag entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditLogViewer() {
  const { token } = useAuth();
  const [page, setPage] = useState(0);
  const [entityType, setEntityType] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [status, setStatus] = useState("all");

  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));
  params.set("skip", String(page * PAGE_SIZE));
  if (entityType !== "all") params.set("entity_type", entityType);
  if (actionType !== "all") params.set("action_type", actionType);
  if (status !== "all") params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", params.toString()],
    queryFn: () => listAuditLogs(`?${params.toString()}`, token),
    enabled: !!token,
  });
  const { data: summaryData } = useQuery({
    queryKey: ["admin-audit-summary"],
    queryFn: () => getAuditSummary("?days=30", token),
    enabled: !!token,
  });

  const entries = data?.data?.entries ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = summaryData?.data ?? {};

  function resetPageAnd(setter) {
    return (value) => {
      setPage(0);
      setter(value);
    };
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-mono text-2xl font-semibold text-slate">{summary.total?.[0]?.total ?? 0}</p>
            <p className="text-xs text-slate-300">Actions in last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-mono text-2xl font-semibold text-brick">{summary.flagged_count?.[0]?.total ?? 0}</p>
            <p className="text-xs text-slate-300">Flagged for review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-mono text-2xl font-semibold text-slate">{summary.by_entity?.length ?? 0}</p>
            <p className="text-xs text-slate-300">Entity types with activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg">Audit log</CardTitle>
            <CardDescription>Append-only record of admin, financial, and escrow lifecycle events.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={entityType} onValueChange={resetPageAnd(setEntityType)}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionType} onValueChange={resetPageAnd(setActionType)}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={resetPageAnd(setStatus)}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="logged">Logged</SelectItem>
                <SelectItem value="flagged_for_review">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )}
              {!isLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-slate-300">
                    No audit entries match these filters.
                  </TableCell>
                </TableRow>
              )}
              {entries.map((e) => (
                <TableRow key={e._id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-slate-300">
                    {formatDate(e.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs font-medium capitalize text-slate">
                    {e.action_type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {e.actor_id?.name || e.actor_id?.email || (
                      <span className="italic text-slate-400">system ({e.actor_role})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs capitalize text-slate-300">{e.entity_type}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-slate-300" title={e.reason}>
                    {e.reason || "—"}
                  </TableCell>
                  <TableCell>
                    {e.status === "flagged_for_review" ? (
                      <Badge variant="danger">Flagged</Badge>
                    ) : (
                      <Badge variant="secondary">Logged</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {e.status !== "flagged_for_review" && <FlagDialog token={token} entryId={e._id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-between border-t border-ink-300 px-5 py-3">
          <p className="text-xs text-slate-300">
            {total === 0 ? "No entries" : `Page ${page + 1} of ${totalPages} · ${total} total`}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
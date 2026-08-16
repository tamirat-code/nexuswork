import { useQuery } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { listDisputes } from "../../services/api/disputes.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function DisputesPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["disputes"], queryFn: () => listDisputes(token), enabled: !!token });
  const disputes = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Support</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Disputes</h1>
        <p className="mt-2 text-sm text-slate-300">Track milestone disputes and their resolution status.</p>
      </header>

      {isLoading && <div className="mt-6 space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>}

      {!isLoading && disputes.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Flag className="mx-auto h-10 w-10 text-escrow" />
          <h3 className="mt-4 font-display text-lg text-slate">No disputes</h3>
          <p className="mt-2 text-sm text-slate-300">Everything is running smoothly. Disputes appear here if a milestone is contested.</p>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {disputes.map((d) => (
          <Card key={d._id} className="animate-fade-up">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate">{d.milestone_id?.title || "Milestone dispute"}</p>
                  <p className="mt-1 text-sm text-slate-300">{d.reason || "No reason provided"}</p>
                </div>
                <StatusBadge kind="dispute" status={d.status} showDot />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-300 pt-3 text-xs text-slate-300">
                <span className="font-mono text-brass">{formatCurrency(d.amount ?? 0)}</span>
                <span>Opened {formatDate(d.createdAt)}</span>
                {d.resolved_at && <span>Resolved {formatDate(d.resolved_at)}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

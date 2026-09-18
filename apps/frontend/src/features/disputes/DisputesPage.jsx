import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import { listMyDisputes } from "../../services/api/disputes.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";

export default function DisputesPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["disputes-mine"], queryFn: () => listMyDisputes(token), enabled: !!token });
  const disputes = data?.data ?? [];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("disputes.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("disputes.title")}</h1>
        <p className="mt-2 text-sm text-content-secondary">{t("disputes.description")}</p>
      </header>

      {isLoading && <div className="mt-6 space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>}

      {!isLoading && disputes.length === 0 && (
        <Card className="mt-8 p-14 text-center border-border-subtle bg-surface-soft">
          <Flag className="mx-auto h-10 w-10 text-success" />
          <h3 className="mt-4 font-display text-lg text-content-primary">{t("disputes.noDisputesTitle")}</h3>
          <p className="mt-2 text-sm text-content-secondary">{t("disputes.noDisputesDesc")}</p>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {disputes.map((d) => (
          <Card key={d._id} className="animate-fade-up border-border-subtle bg-surface-soft">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-content-primary">{d.milestone_id?.title || t("disputes.milestoneDispute")}</p>
                  <p className="mt-1 text-sm text-content-secondary">{d.reason || t("disputes.noReasonProvided")}</p>
                </div>
                <StatusBadge kind="dispute" status={d.status} showDot />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-3 text-xs text-content-secondary">
                <span className="font-mono text-brand">{formatCurrency(d.milestone_id?.amount ?? 0)}</span>
                <span>{t("disputes.opened", { date: formatDate(d.createdAt) })}</span>
                {d.resolved_at && <span>{t("disputes.resolved", { date: formatDate(d.resolved_at) })}</span>}
                {d.outcome && d.status === "resolved" && (
                  <span className="capitalize">{t("disputes.outcome", { outcome: d.outcome.replace("_", " ") })}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
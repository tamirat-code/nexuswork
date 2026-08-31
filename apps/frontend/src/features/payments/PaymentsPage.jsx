import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { listMyPayments } from "../../services/api/payments.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: () => listMyPayments(token), enabled: !!token });
  const payments = data?.data ?? [];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("payments.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("payments.title")}</h1>
        <p className="mt-2 text-sm text-slate-300">{t("payments.description")}</p>
      </header>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.reference")}</TableHead>
                <TableHead>{t("payments.milestone")}</TableHead>
                <TableHead className="text-right">{t("payments.amount")}</TableHead>
                <TableHead>{t("payments.status")}</TableHead>
                <TableHead className="text-right">{t("payments.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
              {!isLoading && payments.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-14 text-center text-slate-300">{t("payments.noPayments")}</TableCell></TableRow>
              )}
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono text-sm text-brass">#{p.reference || p._id.slice(-6)}</TableCell>
                  <TableCell className="text-sm text-slate-300">{p.milestone_id?.title || t("payments.milestone")}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{formatCurrency(p.amount ?? 0)}</TableCell>
                  <TableCell><StatusBadge kind="payment" status={p.status} showDot /></TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300">{formatDate(p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { listMyInvoices } from "../../services/api/invoices.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";

export default function InvoicesPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => listMyInvoices(token), enabled: !!token });
  const invoices = data?.data ?? [];

  return (
    <div className="mx-auto max-w-5xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Money</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Invoices</h1>
        <p className="mt-2 text-sm text-slate-300">Downloadable statements with exact commission breakdowns.</p>
      </header>

      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Date</TableHead>
                <TableHead className="w-16" aria-label="Download" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
              {!isLoading && invoices.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-14 text-center text-slate-300">No invoices yet. They're generated per released milestone.</TableCell></TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell className="font-mono text-sm text-brass">#{inv.number || inv._id.slice(-6)}</TableCell>
                  <TableCell className="text-sm text-slate-300">{inv.client_name || inv.contract_id?.client_id?.name || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{formatCurrency(inv.gross_amount ?? 0)}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{formatCurrency(inv.commission ?? 0)}</TableCell>
                  <TableCell className="text-right font-mono text-brass">{formatCurrency(inv.net_amount ?? 0)}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label="Download invoice"><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

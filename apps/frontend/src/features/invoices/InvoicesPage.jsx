import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "../../lib/stripeClient.js";
import { listMyInvoices, downloadInvoice, createInvoicePaymentIntent } from "../../services/api/invoices.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/shadcn/dialog.jsx";

function StripeInvoicePayment({ invoice, onDone }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) toast.error(result.error.message || t("invoices.paymentFailed", { defaultValue: "Payment failed" }));
    else {
      toast.success(t("invoices.paymentSubmitted", { defaultValue: "Payment submitted. The invoice will update after provider confirmation." }));
      onDone();
    }
    setBusy(false);
  }
  return <form onSubmit={submit} className="space-y-4"><PaymentElement /><Button type="submit" disabled={!stripe || !elements || busy}>{busy ? t("invoices.processing", { defaultValue: "Processing…" }) : t("invoices.payAmount", { amount: formatCurrency(invoice.amount, invoice.currency), defaultValue: "Pay " + formatCurrency(invoice.amount, invoice.currency) })}</Button></form>;
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => listMyInvoices(token), enabled: !!token });
  const invoices = data?.data ?? [];
  const [downloadingId, setDownloadingId] = useState(null);
  const [stripePayment, setStripePayment] = useState(null);
  const payment = useMutation({
    mutationFn: (id) => createInvoicePaymentIntent(id, token),
    onSuccess: (response) => {
      const next = response.data;
      if (next.provider === "chapa") window.location.assign(next.client_secret);
      else setStripePayment(next);
    },
    onError: (error) => toast.error(error.message || t("invoices.paymentStartFailed", { defaultValue: "Could not start invoice payment" })),
  });

  async function handleDownload(id) {
    setDownloadingId(id);
    try {
      await downloadInvoice(id, token, "pdf");
    } catch (err) {
      toast.error(err.message || "Could not download invoice");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">{t("invoices.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary">{t("invoices.title")}</h1>
        <p className="mt-2 text-sm text-content-secondary">{t("invoices.subtitle")}</p>
      </header>

      <Card className="mt-6 overflow-hidden border-border-subtle bg-surface">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoices.invoice")}</TableHead>
                <TableHead>{t("invoices.client")}</TableHead>
                <TableHead className="text-right">{t("invoices.amount")}</TableHead>
                <TableHead>{t("invoices.status")}</TableHead>
                <TableHead className="text-right">{t("invoices.date")}</TableHead>
                <TableHead className="w-16" aria-label="Download" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
              {!isLoading && invoices.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-14 text-center text-content-secondary">{t("invoices.noInvoices")}</TableCell></TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell className="font-mono text-sm text-brand">#{inv.invoice_number || inv._id.slice(-6)}</TableCell>
                  <TableCell className="text-sm text-content-secondary">{inv.client_id?.name || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-brand">{formatCurrency(inv.amount ?? 0, inv.currency || "USD")}</TableCell>
                  <TableCell><Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : inv.status === "cancelled" ? "neutral" : "warning"}>{inv.status || "draft"}</Badge></TableCell>
                  <TableCell className="text-right font-mono text-xs text-content-secondary">{formatDate(inv.createdAt)}</TableCell>
                  <TableCell>
                    {user?.role === "client" && inv.invoice_type === "organization_consolidated" && ["sent", "overdue"].includes(inv.status) && (
                      <Button size="sm" variant="outline" loading={payment.isPending && payment.variables === inv._id} onClick={() => payment.mutate(inv._id)}>{t("invoices.pay", { defaultValue: "Pay" })}</Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Download invoice"
                      disabled={downloadingId === inv._id}
                      onClick={() => handleDownload(inv._id)}
                    >
                      {downloadingId === inv._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={Boolean(stripePayment)} onOpenChange={(open) => !open && setStripePayment(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("invoices.payOrganizationInvoice", { defaultValue: "Pay organization invoice" })}</DialogTitle><DialogDescription>{t("invoices.paymentVerificationHint", { defaultValue: "Payment is verified by the provider before milestones are funded." })}</DialogDescription></DialogHeader>
          {stripePayment && <Elements stripe={stripePromise} options={{ clientSecret: stripePayment.client_secret, appearance: { theme: "night" } }}>
            <StripeInvoicePayment invoice={stripePayment} onDone={() => { setStripePayment(null); queryClient.invalidateQueries({ queryKey: ["invoices"] }); }} />
          </Elements>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

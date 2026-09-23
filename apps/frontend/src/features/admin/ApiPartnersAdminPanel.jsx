import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Activity, Check, Copy, FileText, KeyRound, PauseCircle, Plus, PlugZap, ReceiptText, ShieldCheck, XCircle, ZapOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/shadcn/dialog.jsx";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog.jsx";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { stripePromise } from "../../lib/stripeClient.js";
import {
  createApiPartner, createApiPartnerKey, listApiPartnerBilling, listApiPartnerKeys, listApiPartners,
  revokeApiPartnerKey, updateApiPartnerStatus,
  updateApiPartnerBillingMode, createStripeBillingSetupIntent, saveStripeBillingPaymentMethod, createApiWalletTopUp,
  getApiPartnerAuditLog, chargeApiPartnerStatement, updateApiPartnerBillingStatus,
} from "../../services/api/api-partners.admin.api.js";

const TIERS = ["sandbox", "growth", "enterprise"];
const SCOPES = ["talent:read", "talent:export", "usage:read", "webhooks:manage"];

function statusVariant(status) {
  return status === "active" ? "success" : status === "suspended" ? "warning" : "danger";
}

function SecretNotice({ value, onDismiss, t }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-brass/40 bg-brass/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate">{t("admin.apiSecretTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{t("admin.apiSecretHint")}</p>
        </div>
        <button type="button" onClick={onDismiss} className="text-slate-300 hover:text-slate" aria-label={t("admin.closeSecret")}><XCircle className="h-4 w-4" /></button>
      </div>
      <code className="mt-3 block overflow-x-auto rounded-lg border border-border-subtle bg-surface-soft px-3 py-2 text-xs text-brand">{value}</code>
      <Button className="mt-3" size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(value)}><Copy className="h-3.5 w-3.5" />{t("admin.copySecret")}</Button>
    </div>
  );
}

function ScopePicker({ scopes, selected, onChange, t }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">{t("admin.apiScopes")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {scopes.map((scope) => (
          <label key={scope} className="flex items-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-xs text-slate">
            <input type="checkbox" checked={selected.includes(scope)} onChange={(event) => onChange(event.target.checked ? [...selected, scope] : selected.filter((value) => value !== scope))} className="accent-brass" />
            {scope}
          </label>
        ))}
      </div>
    </div>
  );
}

function StripeBillingSetup({ partnerId, token, clientSecret, onSaved }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const save = useMutation({ mutationFn: (paymentMethodId) => saveStripeBillingPaymentMethod(partnerId, paymentMethodId, token), onSuccess: onSaved });
  async function submit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;
    const result = await stripe.confirmSetup({ elements, redirect: "if_required" });
    if (result.error) return toast.error(result.error.message || t("admin.apiBillingSetupFailed", { defaultValue: "Could not save payment method" }));
    const paymentMethodId = typeof result.setupIntent?.payment_method === "string" ? result.setupIntent.payment_method : result.setupIntent?.payment_method?.id;
    if (paymentMethodId) save.mutate(paymentMethodId);
  }
  return <form onSubmit={submit} className="space-y-4"><PaymentElement /><Button type="submit" disabled={!stripe || !elements || save.isPending} loading={save.isPending}>{t("admin.savePaymentMethod", { defaultValue: "Save payment method" })}</Button></form>;
}

function CreatePartnerDialog({ token, onCreated }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tier, setTier] = useState("sandbox");
  const [scopes, setScopes] = useState(["talent:read", "usage:read"]);

  const create = useMutation({
    mutationFn: () => createApiPartner({ name: name.trim(), organization_name: organizationName.trim() || undefined, contact_email: contactEmail.trim(), tier, scopes }, token),
    onSuccess: (response) => {
      onCreated(response.data.api_key);
      setName(""); setOrganizationName(""); setContactEmail(""); setTier("sandbox"); setScopes(["talent:read", "usage:read"]); setOpen(false);
      toast[response.data.email_sent ? "success" : "warning"](t(response.data.email_sent ? "admin.apiPartnerInviteSent" : "admin.apiPartnerInviteFailed"));
    },
    onError: (error) => toast.error(error.code === "API_PARTNER_EMAIL_EXISTS" ? t("admin.apiPartnerExists") : error.message || t("admin.apiPartnerCreateFailed")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />{t("admin.createApiPartner")}</Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("admin.createApiPartner")}</DialogTitle><DialogDescription>{t("admin.createApiPartnerHint")}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="api-partner-name">{t("admin.apiPartnerName")}</Label><Input id="api-partner-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} placeholder="Talent Integrations Ltd" /></div>
          <div className="space-y-1.5"><Label htmlFor="api-partner-org">{t("admin.apiPartnerOrganization")}</Label><Input id="api-partner-org" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} maxLength={200} placeholder="Optional organization name" /></div>
          <div className="space-y-1.5"><Label htmlFor="api-partner-email">{t("admin.apiPartnerEmail")}</Label><Input id="api-partner-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="integrations@example.com" /></div>
          <div className="space-y-1.5"><Label>{t("admin.apiPartnerTier")}</Label><Select value={tier} onValueChange={setTier}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIERS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          <ScopePicker scopes={SCOPES} selected={scopes} onChange={setScopes} t={t} />
        </div>
        <DialogFooter><Button loading={create.isPending} disabled={name.trim().length < 2 || !contactEmail.trim() || !scopes.length} onClick={() => create.mutate()}>{t("admin.provisionPartner")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ApiPartnersAdminPanel({ token }) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [secret, setSecret] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState(["talent:read"]);
  const [statusTarget, setStatusTarget] = useState(null);
  const [setupIntent, setSetupIntent] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState("10000");
  const [activeTab, setActiveTab] = useState("keys"); // "keys" | "billing" | "audit"

  const partnersQuery = useQuery({ queryKey: ["admin-api-partners"], queryFn: () => listApiPartners(token), enabled: Boolean(token) });
  const partners = partnersQuery.data?.data || [];
  const selectedPartner = partners.find((partner) => String(partner._id) === String(selectedId)) || partners[0];
  const partnerId = selectedPartner?._id;
  const keysQuery = useQuery({ queryKey: ["admin-api-partner-keys", partnerId], queryFn: () => listApiPartnerKeys(partnerId, token), enabled: Boolean(partnerId) });
  const billingQuery = useQuery({ queryKey: ["admin-api-partner-billing", partnerId], queryFn: () => listApiPartnerBilling(partnerId, token), enabled: Boolean(partnerId) });
  const auditQuery = useQuery({
    queryKey: ["admin-api-partner-audit", partnerId],
    queryFn: () => getApiPartnerAuditLog(partnerId, token, 100),
    enabled: Boolean(partnerId) && activeTab === "audit",
  });
  const keys = keysQuery.data?.data || [];
  const billing = billingQuery.data?.data || [];
  const currentBill = billing[0];
  const formatAmount = (minor = 0, currency = "usd") => new Intl.NumberFormat(i18n.language, { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-api-partners"] });
  const refreshBilling = () => queryClient.invalidateQueries({ queryKey: ["admin-api-partner-billing", partnerId] });
  const createKey = useMutation({
    mutationFn: () => createApiPartnerKey(partnerId, { name: keyName.trim(), scopes: keyScopes }, token),
    onSuccess: (response) => { setSecret(response.data.api_key); setKeyName(""); queryClient.invalidateQueries({ queryKey: ["admin-api-partner-keys", partnerId] }); toast[response.data.email_sent ? "success" : "warning"](t(response.data.email_sent ? "admin.apiKeyInviteSent" : "admin.apiKeyInviteFailed")); },
    onError: (error) => toast.error(error.message || t("admin.apiKeyCreateFailed")),
  });
  const revokeKey = useMutation({
    mutationFn: (keyId) => revokeApiPartnerKey(partnerId, keyId, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-api-partner-keys", partnerId] }); toast.success(t("admin.apiKeyRevoked")); },
    onError: (error) => toast.error(error.message),
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }) => updateApiPartnerStatus(id, { status }, token),
    onSuccess: () => { setStatusTarget(null); refresh(); toast.success(t("admin.apiPartnerStatusUpdated")); },
    onError: (error) => toast.error(error.message),
  });
  const changeBillingMode = useMutation({
    mutationFn: (billing_mode) => updateApiPartnerBillingMode(partnerId, billing_mode, token),
    onSuccess: () => { refresh(); toast.success(t("admin.apiBillingModeUpdated", { defaultValue: "Billing mode updated" })); },
    onError: (error) => toast.error(error.message),
  });
  const setupBilling = useMutation({
    mutationFn: () => createStripeBillingSetupIntent(partnerId, token),
    onSuccess: (response) => setSetupIntent(response.data),
    onError: (error) => toast.error(error.message || t("admin.apiBillingSetupFailed", { defaultValue: "Could not start payment setup" })),
  });
  const topUp = useMutation({
    mutationFn: () => createApiWalletTopUp(partnerId, Math.round(Number(topUpAmount) * 100), token),
    onSuccess: (response) => window.location.assign(response.data.checkout_url),
    onError: (error) => toast.error(error.message),
  });
  const chargeStatement = useMutation({
    mutationFn: (ledgerId) => chargeApiPartnerStatement(partnerId, ledgerId, token),
    onSuccess: () => { refreshBilling(); toast.success(t("admin.apiChargeSuccess", { defaultValue: "Charge initiated — statement updating" })); },
    onError: (error) => toast.error(error.message || t("admin.apiChargeFailed", { defaultValue: "Charge failed" })),
  });
  const changeBillingStatus = useMutation({
    mutationFn: ({ ledgerId, status, settlement_reference }) =>
      updateApiPartnerBillingStatus(partnerId, ledgerId, { status, settlement_reference }, token),
    onSuccess: () => { refreshBilling(); toast.success(t("admin.apiBillingStatusUpdated", { defaultValue: "Statement status updated" })); },
    onError: (error) => toast.error(error.message),
  });

  const usageSummary = useMemo(() => {
    if (!selectedPartner) return null;
    return { quota: selectedPartner.monthlyQuota || 0, rate: selectedPartner.requestsPerMinute || 0 };
  }, [selectedPartner]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-brass">{t("admin.apiPartnersEyebrow")}</p><h2 className="mt-2 font-display text-2xl text-slate">{t("admin.apiPartnersTitle")}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{t("admin.apiPartnersDescription")}</p></div>
        <CreatePartnerDialog token={token} onCreated={(value) => { setSecret(value); refresh(); }} />
      </div>

      <SecretNotice value={secret} onDismiss={() => setSecret("")} t={t} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card><CardHeader><CardTitle>{t("admin.apiPartnerDirectory")}</CardTitle><CardDescription>{t("admin.apiPartnerDirectoryHint")}</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>{t("admin.apiPartner")}</TableHead><TableHead>{t("admin.apiPartnerTier")}</TableHead><TableHead>{t("admin.status")}</TableHead><TableHead className="text-right">{t("admin.action")}</TableHead></TableRow></TableHeader><TableBody>{partnersQuery.isLoading && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-300">{t("admin.loading")}</TableCell></TableRow>}{!partnersQuery.isLoading && !partners.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-300">{t("admin.noApiPartners")}</TableCell></TableRow>}{partners.map((partner) => <TableRow key={partner._id} className={String(partner._id) === String(selectedPartner?._id) ? "bg-brass/5" : undefined}><TableCell><button type="button" onClick={() => setSelectedId(partner._id)} className="text-left"><p className="font-semibold text-slate">{partner.name}</p><p className="text-xs text-slate-300">{partner.contact_email}</p></button></TableCell><TableCell className="capitalize text-slate-300">{partner.tier}</TableCell><TableCell><Badge variant={statusVariant(partner.status)}>{partner.status}</Badge></TableCell><TableCell className="text-right"><Button size="xs" variant="outline" onClick={() => setSelectedId(partner._id)}>{t("admin.manage")}</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

        {selectedPartner ? (
          <div className="space-y-6">
          <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{selectedPartner.name}</CardTitle><CardDescription>{selectedPartner.organization_name || selectedPartner.contact_email}</CardDescription></div><Badge variant={statusVariant(selectedPartner.status)}>{selectedPartner.status}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-ink-300 p-3"><p className="text-xs text-slate-300">{t("admin.apiMonthlyQuota")}</p><p className="mt-1 font-mono text-lg text-slate">{usageSummary.quota.toLocaleString()}</p></div><div className="rounded-lg border border-ink-300 p-3"><p className="text-xs text-slate-300">{t("admin.apiRateLimit")}</p><p className="mt-1 font-mono text-lg text-slate">{usageSummary.rate}/min</p></div></div><div className="flex flex-wrap gap-2">{selectedPartner.status !== "active" && <Button size="sm" onClick={() => changeStatus.mutate({ id: selectedPartner._id, status: "active" })} loading={changeStatus.isPending}><Check className="h-3.5 w-3.5" />{t("admin.activate")}</Button>}{selectedPartner.status === "active" && <Button size="sm" variant="secondary" onClick={() => setStatusTarget({ partner: selectedPartner, status: "suspended" })}><PauseCircle className="h-3.5 w-3.5" />{t("admin.suspend")}</Button>}{selectedPartner.status !== "revoked" && <Button size="sm" variant="destructive" onClick={() => setStatusTarget({ partner: selectedPartner, status: "revoked" })}><ShieldCheck className="h-3.5 w-3.5" />{t("admin.revokePartner")}</Button>}</div><div className="flex flex-wrap gap-2">{(selectedPartner.scopes || []).map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}</div></CardContent></Card>

          {/* Tab bar */}
          <div className="flex gap-1 rounded-lg border border-ink-300 bg-ink-50 p-1">
            {[
              { key: "keys", icon: KeyRound, label: t("admin.apiKeys") },
              { key: "billing", icon: ReceiptText, label: t("admin.apiBillingTitle") },
              { key: "audit", icon: FileText, label: t("admin.apiAuditLog", { defaultValue: "Audit log" }) },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${activeTab === key ? "bg-ink-200 text-slate shadow-sm" : "text-slate-300 hover:text-slate"}`}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Keys tab */}
          {activeTab === "keys" && (
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brass" />{t("admin.apiKeys")}</CardTitle><CardDescription>{t("admin.apiKeysHint")}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder={t("admin.apiKeyNamePlaceholder")} /><Button disabled={keyName.trim().length < 2 || !keyScopes.length} loading={createKey.isPending} onClick={() => createKey.mutate()}>{t("admin.issueKey")}</Button></div><ScopePicker scopes={selectedPartner.scopes || []} selected={keyScopes.filter((scope) => (selectedPartner.scopes || []).includes(scope))} onChange={setKeyScopes} t={t} /><div className="space-y-2">{keys.map((key) => <div key={key._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-300 p-3"><div><p className="font-medium text-slate">{key.name}</p><p className="text-xs text-slate-300">{key.key_prefix} · {(key.scopes || []).join(", ")}</p></div>{key.active ? <Button size="xs" variant="ghost" onClick={() => revokeKey.mutate(key._id)} loading={revokeKey.isPending}>{t("admin.revoke")}</Button> : <Badge variant="neutral">{t("admin.revoked")}</Badge>}</div>)}</div></CardContent></Card>
          )}

          {/* Billing tab — FR-35 */}
          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-brass" />{t("admin.apiBillingTitle")}</CardTitle>
                <CardDescription>{t("admin.apiBillingDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Current statement */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: t("admin.apiBillStatus"), value: currentBill?.status || "open" },
                    { label: t("admin.apiBillRequests"), value: (currentBill?.request_count || 0).toLocaleString() },
                    { label: t("admin.apiBillRate"), value: formatAmount(currentBill?.price_per_1000_minor || 0, currentBill?.currency) + " / 1,000" },
                    { label: t("admin.apiBillAmount"), value: formatAmount(currentBill?.amount_minor || 0, currentBill?.currency) },
                    { label: t("admin.apiWalletBalance", { defaultValue: "ETB wallet balance" }), value: formatAmount(selectedPartner.wallet_balance_minor || 0, "etb") },
                  ].map((item) => <div key={item.label} className="rounded-lg border border-ink-300 p-4"><p className="text-xs text-slate-300">{item.label}</p><p className="mt-2 font-display text-xl text-slate">{item.value}</p></div>)}
                </div>

                {/* FR-35: Charge Now + status actions */}
                {currentBill && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-300 pt-4">
                    {["open", "overdue"].includes(currentBill.status) && selectedPartner.billing_mode === "stripe_usage" && (
                      <Button size="sm" loading={chargeStatement.isPending} onClick={() => chargeStatement.mutate(currentBill._id)}>
                        {t("admin.apiChargeNow", { defaultValue: "Charge now" })}
                      </Button>
                    )}
                    {["open", "issued", "overdue"].includes(currentBill.status) && (
                      <Button size="sm" variant="secondary" loading={changeBillingStatus.isPending}
                        onClick={() => changeBillingStatus.mutate({ ledgerId: currentBill._id, status: "issued" })}>
                        {t("admin.apiMarkIssued", { defaultValue: "Mark issued" })}
                      </Button>
                    )}
                    {["issued", "overdue"].includes(currentBill.status) && (
                      <Button size="sm" variant="secondary" loading={changeBillingStatus.isPending}
                        onClick={() => {
                          const ref = window.prompt(t("admin.apiSettlementRefPrompt", { defaultValue: "Enter settlement reference:" }));
                          if (ref) changeBillingStatus.mutate({ ledgerId: currentBill._id, status: "paid", settlement_reference: ref });
                        }}>
                        {t("admin.apiMarkPaid", { defaultValue: "Mark paid" })}
                      </Button>
                    )}
                    {!["paid", "void"].includes(currentBill.status) && (
                      <Button size="sm" variant="ghost" loading={changeBillingStatus.isPending}
                        onClick={() => changeBillingStatus.mutate({ ledgerId: currentBill._id, status: "void" })}>
                        <ZapOff className="mr-1.5 h-3.5 w-3.5" />{t("admin.apiVoidStatement", { defaultValue: "Void" })}
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="text-xs text-slate-300">{t("admin.apiBillingMode", { defaultValue: "Billing mode" })}
                    <select className="ml-2 h-9 rounded border border-ink-300 bg-ink-100 px-2 text-sm text-slate" value={selectedPartner.billing_mode || "manual"} onChange={(event) => changeBillingMode.mutate(event.target.value)}>
                      <option value="manual">{t("admin.manualBilling", { defaultValue: "Manual" })}</option>
                      <option value="prepaid_etb">{t("admin.chapaPrepaidEtb", { defaultValue: "Chapa prepaid ETB" })}</option>
                      <option value="stripe_usage">{t("admin.stripeMonthlyUsage", { defaultValue: "Stripe monthly usage" })}</option>
                    </select>
                  </label>
                  {selectedPartner.billing_mode === "stripe_usage" && <Button size="sm" variant="outline" loading={setupBilling.isPending} onClick={() => setupBilling.mutate()}>{t("admin.savePaymentMethod", { defaultValue: "Save payment method" })}</Button>}
                  {selectedPartner.billing_mode === "prepaid_etb" && <><Input className="w-32" type="number" min="1" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} aria-label={t("admin.etbTopUpAmount", { defaultValue: "ETB top-up amount" })} /><Button size="sm" loading={topUp.isPending} onClick={() => topUp.mutate()}>{t("admin.topUpWallet", { defaultValue: "Top up ETB wallet" })}</Button></>}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300">
                  <span>{t("admin.apiSettlementStatus", { defaultValue: "Settlement" })}: <strong className="text-slate">{currentBill?.settlement_status || t("admin.notApplicable", { defaultValue: "Not applicable" })}</strong></span>
                  <span>{t("admin.apiReconciliationStatus", { defaultValue: "Reconciliation" })}: <strong className="text-slate">{currentBill?.reconciliation_status || t("admin.pending", { defaultValue: "Pending" })}</strong></span>
                  {currentBill?.settlement_reference && <span>{t("admin.settlementRef", { defaultValue: "Ref" })}: <strong className="text-slate">{currentBill.settlement_reference}</strong></span>}
                  {selectedPartner.stripe_payment_method_last4 && <span>{t("admin.savedCard", { defaultValue: "Saved card" })}: <strong className="text-slate">{selectedPartner.stripe_payment_method_brand || "card"} •••• {selectedPartner.stripe_payment_method_last4}</strong></span>}
                </div>

                {/* Statement history */}
                {billing.length > 1 && (
                  <div className="mt-5 space-y-2 border-t border-ink-300 pt-4">
                    <p className="text-sm font-semibold text-slate">{t("admin.apiStatementHistory", { defaultValue: "Statement history" })}</p>
                    {billing.slice(1).map((statement) => (
                      <div key={statement._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-300 p-3 text-xs">
                        <div>
                          <span className="font-medium text-slate">{statement.invoice_number}</span>
                          <span className="ml-2 text-slate-300">{statement.request_count.toLocaleString()} {t("admin.requests", { defaultValue: "requests" })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate">{formatAmount(statement.amount_minor, statement.currency)}</span>
                          <Badge variant={statement.status === "paid" ? "success" : statement.status === "overdue" ? "warning" : "neutral"}>{statement.status}</Badge>
                          {["issued", "overdue"].includes(statement.status) && selectedPartner.billing_mode === "stripe_usage" && (
                            <Button size="xs" variant="outline" loading={chargeStatement.isPending} onClick={() => chargeStatement.mutate(statement._id)}>
                              {t("admin.apiRetryCharge", { defaultValue: "Retry" })}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-slate-300"><Activity className="h-4 w-4 shrink-0 text-teal" />{t("admin.apiPaymentStatusHint")}</p>
                {billingQuery.isLoading && <p className="mt-3 text-xs text-slate-300">{t("admin.loading")}</p>}
              </CardContent>
            </Card>
          )}

          {/* Audit log tab — FR-33 */}
          {activeTab === "audit" && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-brass" />{t("admin.apiAuditLog", { defaultValue: "Audit log" })}</CardTitle>
                    <CardDescription>{t("admin.apiAuditLogDesc", { defaultValue: "All partner_api_read events for this partner, most recent first." })}</CardDescription>
                  </div>
                  {(auditQuery.data?.data?.logs || []).length > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => {
                      const logs = auditQuery.data.data.logs;
                      const header = "timestamp,action,endpoint,fields_requested,fields_returned,result_count,filters";
                      const rows = logs.map((log) => {
                        const m = log.metadata || {};
                        return [
                          new Date(log.createdAt).toISOString(),
                          log.action,
                          m.endpoint || "",
                          (m.fields_requested || []).join("|"),
                          (m.fields_returned || []).join("|"),
                          m.result_count ?? "",
                          JSON.stringify(m.filters || {}),
                        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
                      });
                      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `partner-audit-${partnerId}.csv`; a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      {t("admin.exportCsv", { defaultValue: "Export CSV" })}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {auditQuery.isLoading && <p className="py-6 text-center text-sm text-slate-300">{t("admin.loading")}</p>}
                {auditQuery.isError && <p className="py-6 text-center text-sm text-danger">{auditQuery.error?.message || t("admin.loadFailed", { defaultValue: "Failed to load audit log" })}</p>}
                {!auditQuery.isLoading && (auditQuery.data?.data?.logs || []).length === 0 && (
                  <p className="py-6 text-center text-sm text-slate-300">{t("admin.apiAuditEmpty", { defaultValue: "No Talent API calls recorded for this partner yet." })}</p>
                )}
                {(auditQuery.data?.data?.logs || []).length > 0 && (
                  <div className="space-y-2">
                    {(auditQuery.data.data.logs).map((log) => {
                      const m = log.metadata || {};
                      return (
                        <div key={log._id} className="rounded-lg border border-ink-300 p-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-mono text-slate-300">{new Date(log.createdAt).toLocaleString()}</span>
                            <span className="rounded-full border border-teal/30 bg-teal/10 px-2 py-0.5 font-semibold text-teal">{m.result_count ?? 0} results</span>
                          </div>
                          <p className="mt-1 text-slate">{m.endpoint || log.action}</p>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-slate-300">
                            {m.fields_returned?.length > 0 && <span>Fields returned: <strong className="text-slate">{m.fields_returned.join(", ")}</strong></span>}
                            {m.filters?.q && <span>q: <strong className="text-slate">{m.filters.q}</strong></span>}
                            {m.filters?.skills?.length > 0 && <span>skills: <strong className="text-slate">{m.filters.skills.join(", ")}</strong></span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <PlugZap className="h-8 w-8 text-brass" />
              <p className="mt-3 font-semibold text-slate">{t("admin.selectApiPartner")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPartner && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-brass" />{t("admin.apiBillingTitle")}</CardTitle><CardDescription>{t("admin.apiBillingDescription")}</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[{ label: t("admin.apiBillStatus"), value: currentBill?.status || "open" }, { label: t("admin.apiBillRequests"), value: (currentBill?.request_count || 0).toLocaleString() }, { label: t("admin.apiBillRate"), value: formatAmount(currentBill?.price_per_1000_minor || 0, currentBill?.currency) + " / 1,000" }, { label: t("admin.apiBillAmount"), value: formatAmount(currentBill?.amount_minor || 0, currentBill?.currency) }, { label: t("admin.apiWalletBalance", { defaultValue: "ETB wallet balance" }), value: formatAmount(selectedPartner.wallet_balance_minor || 0, "etb") }].map((item) => <div key={item.label} className="rounded-lg border border-ink-300 p-4"><p className="text-xs text-slate-300">{item.label}</p><p className="mt-2 font-display text-xl text-slate">{item.value}</p></div>)}</div><div className="mt-4 flex flex-wrap items-end gap-2"><label className="text-xs text-slate-300">{t("admin.apiBillingMode", { defaultValue: "Billing mode" })}<select className="ml-2 h-9 rounded border border-ink-300 bg-ink-100 px-2 text-sm text-slate" value={selectedPartner.billing_mode || "manual"} onChange={(event) => changeBillingMode.mutate(event.target.value)}><option value="manual">{t("admin.manualBilling", { defaultValue: "Manual" })}</option><option value="prepaid_etb">{t("admin.chapaPrepaidEtb", { defaultValue: "Chapa prepaid ETB" })}</option><option value="stripe_usage">{t("admin.stripeMonthlyUsage", { defaultValue: "Stripe monthly usage" })}</option></select></label>{selectedPartner.billing_mode === "stripe_usage" && <Button size="sm" variant="outline" loading={setupBilling.isPending} onClick={() => setupBilling.mutate()}>{t("admin.savePaymentMethod", { defaultValue: "Save payment method" })}</Button>}{selectedPartner.billing_mode === "prepaid_etb" && <><Input className="w-32" type="number" min="1" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} aria-label={t("admin.etbTopUpAmount", { defaultValue: "ETB top-up amount" })} /><Button size="sm" loading={topUp.isPending} onClick={() => topUp.mutate()}>{t("admin.topUpWallet", { defaultValue: "Top up ETB wallet" })}</Button></>}</div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300"><span>{t("admin.apiSettlementStatus", { defaultValue: "Settlement" })}: <strong className="text-slate">{currentBill?.settlement_status || t("admin.notApplicable", { defaultValue: "Not applicable" })}</strong></span><span>{t("admin.apiReconciliationStatus", { defaultValue: "Reconciliation" })}: <strong className="text-slate">{currentBill?.reconciliation_status || t("admin.pending", { defaultValue: "Pending" })}</strong></span>{selectedPartner.stripe_payment_method_last4 && <span>{t("admin.savedCard", { defaultValue: "Saved card" })}: <strong className="text-slate">{selectedPartner.stripe_payment_method_brand || "card"} •••• {selectedPartner.stripe_payment_method_last4}</strong></span>}</div>{billing.length > 1 && <div className="mt-5 space-y-2 border-t border-ink-300 pt-4"><p className="text-sm font-semibold text-slate">{t("admin.apiStatementHistory", { defaultValue: "Statement history" })}</p>{billing.slice(1, 5).map((statement) => <div key={statement._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ink-300 p-3 text-xs"><span className="text-slate-300">{statement.invoice_number} · {statement.request_count.toLocaleString()} {t("admin.requests", { defaultValue: "requests" })}</span><span className="font-semibold text-slate">{formatAmount(statement.amount_minor, statement.currency)} · {statement.status}</span></div>)}</div>}<p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-slate-300"><Activity className="h-4 w-4 shrink-0 text-teal" />{t("admin.apiPaymentStatusHint")}</p>{billingQuery.isLoading && <p className="mt-3 text-xs text-slate-300">{t("admin.loading")}</p>}</CardContent></Card>}

      <ConfirmDialog open={Boolean(statusTarget)} loading={changeStatus.isPending} onCancel={() => setStatusTarget(null)} onConfirm={() => changeStatus.mutate({ id: statusTarget.partner._id, status: statusTarget.status })} tone="danger" confirmLabel={statusTarget?.status === "revoked" ? t("admin.revokePartner") : t("admin.suspend")} title={t("admin.confirmPartnerStatusTitle")} description={t("admin.confirmPartnerStatusDescription", { name: statusTarget?.partner?.name, status: statusTarget?.status })} />
      <Dialog open={Boolean(setupIntent)} onOpenChange={(open) => !open && setSetupIntent(null)}>
        <DialogContent><DialogHeader><DialogTitle>{t("admin.savePaymentMethod", { defaultValue: "Save payment method" })}</DialogTitle><DialogDescription>{t("admin.apiBillingSetupHint", { defaultValue: "The saved card will be charged automatically for monthly API usage." })}</DialogDescription></DialogHeader>{setupIntent && <Elements stripe={stripePromise} options={{ clientSecret: setupIntent.client_secret, appearance: { theme: "night" } }}><StripeBillingSetup partnerId={partnerId} token={token} clientSecret={setupIntent.client_secret} onSaved={() => { setSetupIntent(null); refresh(); toast.success(t("admin.apiPaymentMethodSaved", { defaultValue: "Payment method saved" })); }} /></Elements>}</DialogContent>
      </Dialog>
    </div>
  );
}

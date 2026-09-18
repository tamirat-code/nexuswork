import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Check, Copy, KeyRound, Link2, RefreshCw, ShieldCheck, Webhook, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Switch } from "../../components/ui/shadcn/switch.jsx";
import {
  createPartnerKey, createPartnerWebhook, disablePartnerWebhook, getPartnerBilling, getPartnerProfile,
  listPartnerKeys, listPartnerWebhookDeliveries, listPartnerWebhooks, revokePartnerKey,
  rotatePartnerWebhookSecret,
} from "../../services/api/partner.api.js";

const WEBHOOK_EVENTS = ["talent.consent.updated", "usage.threshold"];

function SecretNotice({ secret, onDismiss, t }) {
  if (!secret) return null;
  return (
    <div className="rounded-xl border border-brass/40 bg-brass/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate">{t("partnerPortal.secretTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{t("partnerPortal.secretHint")}</p>
        </div>
        <button type="button" aria-label={t("partnerPortal.dismissSecret")} onClick={onDismiss} className="text-slate-300 hover:text-slate"><X className="h-4 w-4" /></button>
      </div>
      <code className="mt-3 block overflow-x-auto rounded-lg border border-border-subtle bg-surface-soft px-3 py-2 text-xs text-brand">{secret}</code>
      <Button className="mt-3" size="sm" variant="secondary" onClick={() => navigator.clipboard?.writeText(secret)}><Copy className="mr-2 h-3.5 w-3.5" />{t("partnerPortal.copySecret")}</Button>
    </div>
  );
}

export default function PartnerPortalPage() {
  const { t, i18n } = useTranslation();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [keyName, setKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState([WEBHOOK_EVENTS[0]]);
  const [oneTimeSecret, setOneTimeSecret] = useState("");
  const [selectedKeyScopes, setSelectedKeyScopes] = useState([]);

  const profileQuery = useQuery({ queryKey: ["partner-portal-profile", apiKey], queryFn: () => getPartnerProfile(apiKey), enabled: Boolean(apiKey), retry: false });
  const keysQuery = useQuery({ queryKey: ["partner-portal-keys", apiKey], queryFn: () => listPartnerKeys(apiKey), enabled: Boolean(apiKey) });
  const billingQuery = useQuery({ queryKey: ["partner-portal-billing", apiKey], queryFn: () => getPartnerBilling(apiKey), enabled: Boolean(apiKey) });
  const webhooksQuery = useQuery({ queryKey: ["partner-portal-webhooks", apiKey], queryFn: () => listPartnerWebhooks(apiKey), enabled: Boolean(apiKey), retry: false });
  const deliveriesQuery = useQuery({ queryKey: ["partner-portal-deliveries", apiKey], queryFn: () => listPartnerWebhookDeliveries(apiKey), enabled: Boolean(apiKey), retry: false });
  const partner = profileQuery.data?.data;
  const scopes = useMemo(() => partner?.scopes || [], [partner?.scopes]);

  useEffect(() => {
    setSelectedKeyScopes((current) => current.filter((scope) => scopes.includes(scope)).length
      ? current.filter((scope) => scopes.includes(scope))
      : scopes.slice(0, 1));
  }, [scopes]);

  const connect = async () => {
    const next = apiKeyInput.trim();
    if (!next) return;
    try {
      await getPartnerProfile(next);
      setApiKey(next);
      setApiKeyInput("");
    } catch (error) {
      toast.error(error.message || t("partnerPortal.invalidKey"));
    }
  };

  const createKeyMutation = useMutation({
    mutationFn: () => createPartnerKey({ name: keyName.trim(), scopes: selectedKeyScopes }, apiKey),
    onSuccess: (response) => { setOneTimeSecret(response.data.api_key); setKeyName(""); keysQuery.refetch(); toast.success(t("partnerPortal.keyCreated")); },
    onError: (error) => toast.error(error.message),
  });
  const revokeKeyMutation = useMutation({ mutationFn: (id) => revokePartnerKey(id, apiKey), onSuccess: () => { keysQuery.refetch(); toast.success(t("partnerPortal.keyRevoked")); }, onError: (error) => toast.error(error.message) });
  const createWebhookMutation = useMutation({
    mutationFn: () => createPartnerWebhook({ url: webhookUrl.trim(), events: webhookEvents }, apiKey),
    onSuccess: (response) => { setOneTimeSecret(response.data.webhook_secret); setWebhookUrl(""); webhooksQuery.refetch(); toast.success(t("partnerPortal.webhookCreated")); },
    onError: (error) => toast.error(error.message),
  });
  const rotateWebhookMutation = useMutation({ mutationFn: (id) => rotatePartnerWebhookSecret(id, apiKey), onSuccess: (response) => { setOneTimeSecret(response.data.webhook_secret); webhooksQuery.refetch(); toast.success(t("partnerPortal.secretRotated")); }, onError: (error) => toast.error(error.message) });
  const disableWebhookMutation = useMutation({ mutationFn: (id) => disablePartnerWebhook(id, apiKey), onSuccess: () => { webhooksQuery.refetch(); toast.success(t("partnerPortal.webhookDisabled")); }, onError: (error) => toast.error(error.message) });

  const billing = billingQuery.data?.data?.current;
  const formatAmount = (minor = 0, currency = "usd") => new Intl.NumberFormat(i18n.language, { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  const connected = Boolean(apiKey && partner);
  const webhookAccessError = webhooksQuery.error?.code === "PARTNER_SCOPE_REQUIRED";
  const canCreateKey = keyName.trim().length >= 2;
  const canCreateWebhook = webhookUrl.trim().length > 0 && webhookEvents.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl py-8">
      <header className="border-b border-ink-300 pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">{t("partnerPortal.eyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-slate">{t("partnerPortal.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">{t("partnerPortal.subtitle")}</p>
      </header>

      {!connected ? (
        <Card className="mx-auto mt-8 max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-brass" /> {t("partnerPortal.connectTitle")}</CardTitle>
            <CardDescription>{t("partnerPortal.connectDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="partner-api-key">{t("partnerPortal.apiKeyLabel")}</Label><Input id="partner-api-key" type="password" value={apiKeyInput} onChange={(event) => setApiKeyInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") connect(); }} placeholder="nw_…" autoComplete="off" /></div>
            <Button className="w-full" onClick={connect} loading={profileQuery.isFetching}><Link2 className="mr-2 h-4 w-4" />{t("partnerPortal.connect")}</Button>
            <p className="text-xs leading-relaxed text-slate-300">{t("partnerPortal.keyNeverStored")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-300 bg-ink-50 p-4">
            <div><p className="text-xs uppercase tracking-wider text-slate-300">{t("partnerPortal.connectedAs")}</p><p className="mt-1 font-display text-xl text-slate">{partner.name}</p></div>
            <div className="flex items-center gap-2"><span className="rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal"><Check className="mr-1 inline h-3.5 w-3.5" />{partner.status}</span><Button size="sm" variant="ghost" onClick={() => setApiKey("")}>{t("partnerPortal.disconnect")}</Button></div>
          </div>

          <SecretNotice secret={oneTimeSecret} onDismiss={() => setOneTimeSecret("")} t={t} />

          <div className="grid gap-4 md:grid-cols-4">
            {[{ label: t("partnerPortal.tier"), value: partner.tier }, { label: t("partnerPortal.monthlyUsage"), value: `${partner.usage?.requestCount || 0} / ${partner.usage?.quota || 0}` }, { label: t("partnerPortal.remaining"), value: partner.usage?.remaining || 0 }, { label: t("partnerPortal.currentBill"), value: formatAmount(billing?.amount_minor, billing?.currency) }].map((item) => <Card key={item.label}><CardContent className="p-5"><p className="text-xs uppercase tracking-wider text-slate-300">{item.label}</p><p className="mt-2 font-display text-2xl text-slate">{item.value}</p></CardContent></Card>)}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brass" />{t("partnerPortal.keysTitle")}</CardTitle><CardDescription>{t("partnerPortal.keysDescription")}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2"><Input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder={t("partnerPortal.keyNamePlaceholder")} /><Button disabled={!canCreateKey || !selectedKeyScopes.length} loading={createKeyMutation.isPending} onClick={() => createKeyMutation.mutate()}>{t("partnerPortal.createKey")}</Button></div>
                <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">{t("partnerPortal.keyScopes")}</p><div className="flex flex-wrap gap-3">{scopes.map((scope) => <label key={scope} className="flex items-center gap-2 text-xs text-slate"><input type="checkbox" checked={selectedKeyScopes.includes(scope)} onChange={(event) => setSelectedKeyScopes((current) => event.target.checked ? [...current, scope] : current.filter((item) => item !== scope))} className="accent-brass" />{scope}</label>)}</div></div>
                <div className="space-y-2">{(keysQuery.data?.data || []).map((key) => <div key={key._id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-300 p-3"><div><p className="font-medium text-slate">{key.name}</p><p className="text-xs text-slate-300">{key.key_prefix} · {key.active ? t("partnerPortal.active") : t("partnerPortal.revoked")}</p></div>{key.active && <Button size="sm" variant="ghost" onClick={() => revokeKeyMutation.mutate(key._id)} loading={revokeKeyMutation.isPending}>{t("partnerPortal.revoke")}</Button>}</div>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-brass" />{t("partnerPortal.billingTitle")}</CardTitle><CardDescription>{t("partnerPortal.billingDescription")}</CardDescription></CardHeader>
              <CardContent className="space-y-3"><div className="flex justify-between text-sm"><span className="text-slate-300">{t("partnerPortal.statementStatus")}</span><span className="font-semibold text-slate">{billing?.status || "open"}</span></div><div className="flex justify-between text-sm"><span className="text-slate-300">{t("partnerPortal.billableRequests")}</span><span className="font-semibold text-slate">{billing?.request_count || 0}</span></div><div className="flex justify-between border-t border-ink-300 pt-3 text-sm"><span className="font-semibold text-slate">{t("partnerPortal.amountDue")}</span><span className="font-display text-xl text-brass">{formatAmount(billing?.amount_minor, billing?.currency)}</span></div><p className="text-xs leading-relaxed text-slate-300">{t("partnerPortal.billingHint")}</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-4 w-4 text-brass" />{t("partnerPortal.webhooksTitle")}</CardTitle><CardDescription>{t("partnerPortal.webhooksDescription")}</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {webhookAccessError ? <p className="rounded-lg border border-brass/30 bg-brass/10 p-3 text-sm text-slate-300">{t("partnerPortal.webhookScopeRequired")}</p> : <>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]"><Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://partner.example.com/webhooks/nexuswork" /><Button disabled={!canCreateWebhook} loading={createWebhookMutation.isPending} onClick={() => createWebhookMutation.mutate()}>{t("partnerPortal.addWebhook")}</Button></div>
                <div className="flex flex-wrap gap-4">{WEBHOOK_EVENTS.map((event) => <label key={event} className="flex items-center gap-2 text-sm text-slate"><input type="checkbox" checked={webhookEvents.includes(event)} onChange={(e) => setWebhookEvents((current) => e.target.checked ? [...current, event] : current.filter((item) => item !== event))} className="accent-brass" />{event}</label>)}</div>
                <div className="space-y-2">{(webhooksQuery.data?.data || []).map((hook) => <div key={hook._id} className="rounded-lg border border-ink-300 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="break-all font-medium text-slate">{hook.url}</p><p className="mt-1 text-xs text-slate-300">{hook.events.join(", ")} · {hook.status} · {hook.secret_prefix}</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => rotateWebhookMutation.mutate(hook._id)}><RefreshCw className="mr-1 h-3.5 w-3.5" />{t("partnerPortal.rotate")}</Button>{hook.status === "active" && <Button size="sm" variant="ghost" onClick={() => disableWebhookMutation.mutate(hook._id)}>{t("partnerPortal.disable")}</Button>}</div></div></div>)}</div>
                <div className="border-t border-ink-300 pt-4"><p className="mb-2 text-sm font-semibold text-slate">{t("partnerPortal.deliveryLog")}</p>{(deliveriesQuery.data?.data || []).slice(0, 8).map((delivery) => <div key={delivery._id} className="flex flex-wrap justify-between gap-2 py-2 text-xs"><span className="text-slate-300">{delivery.event_type} · {delivery.event_id}</span><span className={delivery.status === "delivered" ? "text-teal" : "text-brick"}>{delivery.status}</span></div>)}</div>
              </>}
            </CardContent>
          </Card>

          <p className="flex items-center gap-2 text-xs text-slate-300"><ShieldCheck className="h-4 w-4 text-teal" />{t("partnerPortal.securityHint")} · {scopes.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

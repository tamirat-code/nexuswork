import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getOrganizationSso, updateOrganizationSso } from "../../services/api/organizations.api.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";

export default function OrganizationSsoSettings({ organizationId, token }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({ enabled: false, enforced: false, issuer: "", client_id: "", client_secret: "", allowed_domains: "", role_claim: "groups", admin_group: "admin", recruiter_group: "recruiter", billing_group: "billing_viewer" });
  const sso = useQuery({ queryKey: ["organization-sso", organizationId], queryFn: () => getOrganizationSso(organizationId, token), enabled: Boolean(organizationId && token) });
  useEffect(() => {
    const value = sso.data?.data;
    if (value) setForm((current) => ({ ...current, ...value, allowed_domains: (value.allowed_domains || []).join(", "), admin_group: value.role_mapping?.admin?.[0] || "admin", recruiter_group: value.role_mapping?.recruiter?.[0] || "recruiter", billing_group: value.role_mapping?.billing_viewer?.[0] || "billing_viewer" }));
  }, [sso.data]);
  const save = useMutation({
    mutationFn: () => updateOrganizationSso(organizationId, { enabled: form.enabled, enforced: form.enabled && form.enforced, issuer: form.issuer || undefined, client_id: form.client_id || undefined, client_secret: form.client_secret || undefined, allowed_domains: form.allowed_domains.split(",").map((item) => item.trim()).filter(Boolean), role_claim: form.role_claim, role_mapping: { admin: [form.admin_group], recruiter: [form.recruiter_group], billing_viewer: [form.billing_group] } }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-sso", organizationId] }); setForm((current) => ({ ...current, client_secret: "" })); toast.success(t("organizations.ssoSaved", { defaultValue: "Organization SSO settings saved" })); },
    onError: (error) => toast.error(error.message),
  });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  return <Card className="mt-6 border-brand/25 bg-brand-soft"><CardHeader><CardTitle>{t("organizations.ssoTitle", { defaultValue: "Organization SSO" })}</CardTitle><p className="text-sm text-content-secondary">{t("organizations.ssoHint", { defaultValue: "Use OIDC to route organization members through your identity provider." })}</p></CardHeader><CardContent className="space-y-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={set("enabled")} />{t("organizations.enableSso", { defaultValue: "Enable OIDC SSO" })}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enforced} onChange={set("enforced")} disabled={!form.enabled} />{t("organizations.enforceSso", { defaultValue: "Require SSO for organization members" })}</label><div className="grid gap-3 md:grid-cols-2"><Input placeholder={t("organizations.oidcIssuer", { defaultValue: "OIDC issuer URL" })} value={form.issuer} onChange={set("issuer")} /><Input placeholder={t("organizations.oidcClientId", { defaultValue: "OIDC client ID" })} value={form.client_id} onChange={set("client_id")} /><Input type="password" placeholder={t("organizations.oidcClientSecret", { defaultValue: "OIDC client secret" })} value={form.client_secret} onChange={set("client_secret")} /><Input placeholder={t("organizations.ssoDomains", { defaultValue: "Allowed domains, comma separated" })} value={form.allowed_domains} onChange={set("allowed_domains")} /><Input placeholder={t("organizations.ssoRoleClaim", { defaultValue: "Role claim (e.g. groups)" })} value={form.role_claim} onChange={set("role_claim")} /><Input placeholder="Admin group" value={form.admin_group} onChange={set("admin_group")} /><Input placeholder="Recruiter group" value={form.recruiter_group} onChange={set("recruiter_group")} /><Input placeholder="Billing viewer group" value={form.billing_group} onChange={set("billing_group")} /></div><Button loading={save.isPending} onClick={() => save.mutate()}>{t("organizations.saveSso", { defaultValue: "Save SSO settings" })}</Button></CardContent></Card>;
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listOrganizationAuditLogs } from "../../services/api/audit-logs.api.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";

export default function OrganizationAuditPanel({ organizationId, token }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({ user_id: "", action_type: "", entity_type: "", start_date: "", end_date: "" });
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const audit = useQuery({
    queryKey: ["organization-audit", organizationId, query.toString()],
    queryFn: () => listOrganizationAuditLogs(organizationId, `?${query.toString()}`, token),
    enabled: Boolean(organizationId && token),
  });
  const update = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  const entries = audit.data?.data?.entries || [];

  return (
    <Card className="mt-6 border-border-subtle bg-surface-soft">
      <CardHeader className="border-b border-border-subtle"><CardTitle>{t("organizations.auditHistory", { defaultValue: "Organization audit history" })}</CardTitle><p className="text-sm text-content-secondary">{t("organizations.auditHistoryHint", { defaultValue: "Review member activity by date, user, action, or resource." })}</p></CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-2 md:grid-cols-5">
          <Input placeholder={t("organizations.auditUserId", { defaultValue: "User ID" })} value={filters.user_id} onChange={update("user_id")} />
          <Input placeholder={t("organizations.auditAction", { defaultValue: "Action" })} value={filters.action_type} onChange={update("action_type")} />
          <Input placeholder={t("organizations.auditResource", { defaultValue: "Resource type" })} value={filters.entity_type} onChange={update("entity_type")} />
          <Input type="date" aria-label={t("organizations.auditFrom", { defaultValue: "From" })} value={filters.start_date} onChange={update("start_date")} />
          <Input type="date" aria-label={t("organizations.auditTo", { defaultValue: "To" })} value={filters.end_date} onChange={update("end_date")} />
        </div>
        {audit.isLoading && <p className="text-sm text-content-secondary">{t("organizations.loadingAudit", { defaultValue: "Loading audit history..." })}</p>}
        {audit.isError && <p className="text-sm text-danger">{t("organizations.auditUnavailable", { defaultValue: "Audit history is unavailable right now." })}</p>}
        {!audit.isLoading && !entries.length && <p className="rounded-control border border-dashed border-border-subtle p-4 text-sm text-content-secondary">{t("organizations.noAuditEntries", { defaultValue: "No audit entries match these filters." })}</p>}
        <div className="max-h-80 space-y-2 overflow-y-auto">{entries.map((entry) => <div key={entry._id} className="rounded-control border border-border-subtle bg-surface p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium text-content-primary">{entry.action_type}</span><time className="text-xs text-content-muted">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</time></div><p className="mt-1 text-xs text-content-secondary">{entry.entity_type} · {entry.actor_id?.name || entry.actor_id?.email || entry.actor_role || "system"}</p></div>)}</div>
      </CardContent>
    </Card>
  );
}

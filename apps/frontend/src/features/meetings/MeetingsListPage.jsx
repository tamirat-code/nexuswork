import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { listContractMeetings } from "../../services/api/meetings.api.js";
import { useAuth } from "../../hooks/useAuth.js";

export default function MeetingsListPage() {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const contracts = useQuery({ queryKey: ["contracts"], queryFn: () => listMyContracts(token), enabled: !!token });
  const ids = contracts.data?.data || [];
  const meetings = useQuery({ queryKey: ["upcoming-meetings", ids.map((c) => c._id)], queryFn: async () => (await Promise.all(ids.map((c) => listContractMeetings(c._id, token)))).flatMap((r) => r.data || []), enabled: ids.length > 0 });
  if (contracts.isError || meetings.isError) return <div className="space-y-5"><h1 className="font-display text-2xl text-content-primary">{t("navigation.meetings")}</h1><p role="alert" className="rounded border border-danger p-4 text-sm text-danger">{contracts.error?.message || meetings.error?.message || "Could not load meetings. Please try again."}</p></div>;
  return <div className="space-y-5"><h1 className="font-display text-2xl text-content-primary">{t("navigation.meetings")}</h1>{contracts.isLoading || meetings.isLoading ? <p className="text-content-secondary">{t("common.loading")}</p> : meetings.data?.length ? <div className="grid gap-3">{meetings.data.map((m) => <Link key={m._id} to={`/meetings/${m._id}`} className="rounded-card border border-border-subtle bg-surface-soft p-4 hover:border-brand"><p className="font-semibold text-content-primary">{m.title}</p><p className="text-sm text-content-secondary">{new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(m.scheduled_start))} · {t(`meetings.status.${m.status}`, m.status)}</p></Link>)}</div> : <p className="text-content-secondary">{t("meetings.empty", "No upcoming meetings.")}</p>}</div>;
}

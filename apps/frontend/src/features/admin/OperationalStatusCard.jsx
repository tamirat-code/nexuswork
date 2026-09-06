import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/v1";

async function readHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Health check failed (${response.status})`);
  return payload.data;
}

function StatusRow({ label, value, healthy = true }) {
  return <div className="flex items-center justify-between gap-4 border-t border-ink-300/70 py-3 text-sm"><span className="text-slate-300">{label}</span><span className={`inline-flex items-center gap-1.5 font-semibold ${healthy ? "text-escrow" : "text-brick"}`}><span className={`h-2 w-2 rounded-full ${healthy ? "bg-escrow" : "bg-brick"}`} aria-hidden="true" />{value}</span></div>;
}

export default function OperationalStatusCard() {
  const health = useQuery({ queryKey: ["admin", "health"], queryFn: readHealth, refetchInterval: 60_000, retry: 1 });
  const data = health.data;
  const healthy = Boolean(data?.status === "ok" && data?.db === "connected");

  return <Card className="mt-6 border-brand/30"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-brand" /> Operational status</CardTitle><p className="mt-1 text-sm text-slate-300">Live API and database readiness from the current deployment.</p></div><Button variant="ghost" size="sm" onClick={() => health.refetch()} disabled={health.isFetching} aria-label="Refresh operational status"><RefreshCw className={`h-4 w-4 ${health.isFetching ? "animate-spin" : ""}`} /></Button></CardHeader><CardContent>{health.isLoading && <div className="flex items-center gap-2 py-3 text-sm text-slate-300" role="status"><RefreshCw className="h-4 w-4 animate-spin" /> Checking services…</div>}{health.isError && <div className="flex items-start gap-2 rounded-lg border border-brick/30 bg-brick-100/20 p-3 text-sm text-brick" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> The health endpoint could not be reached. Check the deployment and API URL.</div>}{data && <div><div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${healthy ? "text-escrow" : "text-brick"}`}>{healthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{healthy ? "All reported services are operational" : "Action may be required"}</div><StatusRow label="API" value={data.status === "ok" ? "Operational" : data.status} healthy={data.status === "ok"} /><StatusRow label="Database" value={data.db} healthy={data.db === "connected"} /><StatusRow label="Process uptime" value={`${Math.floor(Number(data.uptime_seconds || 0) / 60)} min`} /><p className="mt-3 text-[11px] text-slate-400">Last checked {data.timestamp ? new Date(data.timestamp).toLocaleString() : " just now"}. This panel does not replace payment-provider or email-provider monitoring.</p></div>}</CardContent></Card>;
}

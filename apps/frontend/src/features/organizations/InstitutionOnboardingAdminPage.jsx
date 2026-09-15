import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { decideInstitutionOnboarding, listInstitutionOnboardingRequests } from "../../services/api/organizations.api.js";
import { openFilePreview } from "../../services/api/files.api.js";
import { displayFilename } from "../../utils/filename.utils.js";

export default function InstitutionOnboardingAdminPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const requests = useQuery({ queryKey: ["institution-onboarding", "pending"], queryFn: () => listInstitutionOnboardingRequests("pending", token) });
  const decide = useMutation({
    mutationFn: ({ id, decision }) => decideInstitutionOnboarding(id, { decision, rejectionReason: decision === "rejected" ? reason.trim() : undefined }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["institution-onboarding", "pending"] }); setReason(""); toast.success("Onboarding request updated"); },
    onError: (error) => toast.error(error.message),
  });

  return <div className="w-full animate-fade-up"><header className="border-b border-ink-300 pb-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Institution administration</p><h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Onboarding requests</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Review the institution identity, domain, contact, and supporting evidence before approval.</p></header><div className="mt-6 grid gap-4">{requests.isLoading && <p className="text-sm text-slate-300">Loading requests…</p>}{!requests.isLoading && !requests.data?.data?.length && <Card><CardContent className="p-6 text-sm text-slate-300">No pending onboarding requests.</CardContent></Card>}{requests.data?.data?.map((item) => <Card key={item._id}><CardHeader className="flex-row items-start justify-between"><div><CardTitle>{item.institutionName}</CardTitle><p className="mt-1 text-sm text-slate-300">{item.domain} · {item.contactName} · {item.contactTitle}</p><p className="text-xs text-slate-400">Requested by {item.requested_by?.name || item.contactEmail}</p></div><Badge variant="warning">Pending review</Badge></CardHeader><CardContent><div className="rounded-card border border-ink-300 bg-ink-700 p-4 text-sm"><p className="font-semibold text-slate">Evidence required</p>{item.evidence_file_id ? <button type="button" className="mt-2 font-semibold text-brass underline-offset-2 hover:underline" onClick={async () => { try { await openFilePreview(item.evidence_file_id._id, token); } catch (error) { toast.error(error.message); } }}>Open {displayFilename(item.evidence_file_id.original_name)} · {Math.ceil(item.evidence_file_id.size / 1024)} KB</button> : <p className="mt-2 text-brick">No evidence attached. This request cannot be approved.</p>}</div><Textarea className="mt-4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional rejection reason" rows={3} /><div className="mt-3 flex justify-end gap-2"><Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: item._id, decision: "rejected" })}>Reject</Button><Button disabled={decide.isPending || !item.evidence_file_id} loading={decide.isPending} onClick={() => decide.mutate({ id: item._id, decision: "approved" })}>Approve institution</Button></div></CardContent></Card>)}</div></div>;
}

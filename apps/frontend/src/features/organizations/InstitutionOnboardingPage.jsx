import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { listMyInstitutionRequests, requestInstitutionOnboarding } from "../../services/api/organizations.api.js";
import { uploadFile } from "../../services/api/files.api.js";
import FileUpload from "../../components/ui/FileUpload.jsx";

const statusConfig = {
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Needs changes", variant: "danger", icon: AlertCircle },
  pending: { label: "Under review", variant: "warning", icon: Clock3 },
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export default function InstitutionOnboardingPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ institutionName: "", domain: "", contactName: user?.name || "", contactEmail: user?.email || "", contactTitle: "" });
  const [evidence, setEvidence] = useState(null);
  const requests = useQuery({ queryKey: ["institution-onboarding", "mine"], queryFn: () => listMyInstitutionRequests(token), enabled: Boolean(token) });
  const requestHistory = requests.data?.data || [];
  const hasPendingRequest = requestHistory.some((item) => item.status === "pending");
  const isValid = useMemo(() => Object.values(form).every((value) => value.trim()) && Boolean(evidence), [form, evidence]);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const upload = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "institution_onboarding_evidence", token }),
    onSuccess: ({ data }) => { setEvidence(data); toast.success("Evidence uploaded securely"); },
    onError: (error) => toast.error(error.message),
  });
  const submit = useMutation({
    mutationFn: (payload) => requestInstitutionOnboarding(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institution-onboarding", "mine"] });
      toast.success("Institution onboarding request submitted");
      setForm((current) => ({ ...current, institutionName: "", domain: "", contactTitle: "" }));
      setEvidence(null);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-up space-y-6">
      <header className="relative overflow-hidden rounded-card border border-border-subtle bg-surface-soft px-6 py-8 shadow-card sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-soft blur-3xl" />
        <div className="relative flex max-w-3xl items-start gap-4">
          <div className="hidden rounded-card border border-brand/25 bg-brand-soft p-3 text-brand sm:block"><Building2 className="h-7 w-7" aria-hidden="true" /></div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Institution onboarding</p>
            <h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary sm:text-4xl">Bring your institution to NexusWork</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-content-secondary">Submit your institution details and official evidence. Our administrators verify the request before enabling the institution workspace and university services.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <Card>
          <CardHeader className="border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="rounded-control bg-brand-soft p-2 text-brand"><FileCheck2 className="h-5 w-5" aria-hidden="true" /></div>
              <div><CardTitle>Request institution verification</CardTitle><CardDescription className="mt-1">Provide information an administrator can verify.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {hasPendingRequest && <div className="flex gap-3 rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700" role="status"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>Your current request is under review. You can submit another request after it has been resolved.</p></div>}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="institution-name">Institution name</Label><Input id="institution-name" className="mt-2" value={form.institutionName} onChange={update("institutionName")} placeholder="University of Gondar" disabled={hasPendingRequest} /></div>
              <div className="sm:col-span-2"><Label htmlFor="institution-domain">Official email domain</Label><Input id="institution-domain" className="mt-2" value={form.domain} onChange={update("domain")} placeholder="uog.edu.et" disabled={hasPendingRequest} /><p className="mt-1.5 text-xs text-content-secondary">Enter the domain only—do not include https:// or an email address.</p></div>
              <div><Label htmlFor="contact-name">Authorized contact</Label><Input id="contact-name" className="mt-2" value={form.contactName} onChange={update("contactName")} placeholder="Full name" disabled={hasPendingRequest} /></div>
              <div><Label htmlFor="contact-title">Contact title</Label><Input id="contact-title" className="mt-2" value={form.contactTitle} onChange={update("contactTitle")} placeholder="Registrar" disabled={hasPendingRequest} /></div>
              <div className="sm:col-span-2"><Label htmlFor="contact-email">Official contact email</Label><Input id="contact-email" className="mt-2" type="email" value={form.contactEmail} onChange={update("contactEmail")} placeholder="registrar@university.edu" disabled={hasPendingRequest} /></div>
            </div>

            <FileUpload label="Supporting evidence" hint="Official authorization letter, staff ID, or institutional document · PDF, JPG, or PNG · up to 10 MB" accept=".pdf,.jpg,.jpeg,.png" maxSizeMb={10} files={evidence ? [{ id: evidence._id, name: evidence.original_name, size: evidence.size }] : []} progress={upload.isPending ? 25 : undefined} onFilesSelected={([file]) => upload.mutate(file)} disabled={hasPendingRequest || upload.isPending || submit.isPending} onRemove={() => setEvidence(null)} />
            <div className="flex items-start gap-2 text-xs text-content-secondary"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /><span>This document is private and is only available to administrators reviewing your request.</span></div>
            <Button className="w-full sm:w-auto" loading={submit.isPending} disabled={hasPendingRequest || submit.isPending || upload.isPending || !isValid} onClick={() => submit.mutate({ ...form, evidence_file_id: evidence._id })}>Submit for review</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>What happens next?</CardTitle><CardDescription className="mt-1">A clear review process from request to activation.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {["We securely receive your request and evidence.", "An administrator reviews the institution details.", "Once approved, the institution is connected to university services.", "Clients can then select it as an institution tenant for an organization."].map((step, index) => <div key={step} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{index + 1}</span><p className="text-sm leading-5 text-content-secondary">{step}</p></div>)}
            </CardContent>
          </Card>

          {requestHistory.length > 0 && <Card>
            <CardHeader><CardTitle>Request history</CardTitle><CardDescription className="mt-1">Track every request submitted from your account.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {requestHistory.map((item) => {
                return <div key={item._id} className="rounded-control border border-ink-300 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate">{item.institutionName}</p><p className="mt-1 truncate text-xs text-slate-300">{item.domain}</p></div><Badge variant={config.variant}><StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />{config.label}</Badge></div><p className="mt-3 text-xs text-slate-400">Submitted {formatDate(item.createdAt)}</p>{item.status === "approved" && <p className="mt-2 text-xs leading-5 text-escrow">Institution services are now connected to your account.</p>}{item.status === "rejected" && item.rejectionReason && <p className="mt-2 text-xs leading-5 text-brick">{item.rejectionReason}</p>}</div>;
              })}
            </CardContent>
          </Card>}
        </div>
      </div>
    </div>
  );
}

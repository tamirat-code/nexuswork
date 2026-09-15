import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { requestInstitutionOnboarding } from "../../services/api/organizations.api.js";
import { openFilePreview, uploadFile } from "../../services/api/files.api.js";
import FileUpload from "../../components/ui/FileUpload.jsx";

export default function InstitutionOnboardingPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ institutionName: "", domain: "", contactName: user?.name || "", contactEmail: user?.email || "", contactTitle: "" });
  const [evidence, setEvidence] = useState(null);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const upload = useMutation({
    mutationFn: (file) => uploadFile(file, { relatedType: "institution_onboarding_evidence", token }),
    onSuccess: ({ data }) => { setEvidence(data); toast.success("Evidence uploaded securely"); },
    onError: (error) => toast.error(error.message),
  });
  const submit = useMutation({
    mutationFn: (payload) => requestInstitutionOnboarding(payload, token),
    onSuccess: () => { toast.success("Institution onboarding request submitted"); setForm((current) => ({ ...current, institutionName: "", domain: "", contactTitle: "" })); setEvidence(null); },
    onError: (error) => toast.error(error.message),
  });
  return <div className="mx-auto w-full max-w-2xl animate-fade-up"><header className="border-b border-ink-300 pb-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Institution onboarding</p><h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Request an institution tenant</h1><p className="mt-2 text-sm text-slate-300">An administrator reviews the official domain and supporting evidence before the institution becomes active on NexusWork.</p></header><Card className="mt-6"><CardHeader><CardTitle>Institution details</CardTitle><CardDescription>Use the institution’s official email domain, without https://.</CardDescription></CardHeader><CardContent className="space-y-5"><div><Label htmlFor="institution-name">Institution name</Label><Input id="institution-name" className="mt-2" value={form.institutionName} onChange={update("institutionName")} placeholder="University of Gondar" /></div><div><Label htmlFor="institution-domain">Official domain</Label><Input id="institution-domain" className="mt-2" value={form.domain} onChange={update("domain")} placeholder="uog.edu.et" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="contact-name">Contact name</Label><Input id="contact-name" className="mt-2" value={form.contactName} onChange={update("contactName")} /></div><div><Label htmlFor="contact-title">Contact title</Label><Input id="contact-title" className="mt-2" value={form.contactTitle} onChange={update("contactTitle")} placeholder="Registrar" /></div></div><div><Label htmlFor="contact-email">Contact email</Label><Input id="contact-email" className="mt-2" type="email" value={form.contactEmail} onChange={update("contactEmail")} /></div><FileUpload label="Supporting evidence" hint="Upload an official authorization letter, staff ID, or institutional document. PDF, JPG, or PNG up to 10 MB." accept=".pdf,.jpg,.jpeg,.png" maxSizeMb={10} files={evidence ? [{ id: evidence._id, name: evidence.original_name, size: evidence.size }] : []} progress={upload.isPending ? 25 : undefined} onFilesSelected={([file]) => upload.mutate(file)} disabled={upload.isPending || submit.isPending} onRemove={() => setEvidence(null)} /><p className="text-xs text-slate-400">The administrator will be able to open this private document during review.</p><Button loading={submit.isPending} disabled={submit.isPending || upload.isPending || !evidence || Object.values(form).some((value) => !value.trim())} onClick={() => submit.mutate({ ...form, evidence_file_id: evidence._id })}>Submit onboarding request</Button></CardContent></Card></div>;
}

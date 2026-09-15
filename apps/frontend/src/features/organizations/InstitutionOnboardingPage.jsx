import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { requestInstitutionOnboarding } from "../../services/api/organizations.api.js";

export default function InstitutionOnboardingPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState({ institutionName: "", domain: "", contactName: user?.name || "", contactEmail: user?.email || "", contactTitle: "" });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = useMutation({
    mutationFn: () => requestInstitutionOnboarding(form, token),
    onSuccess: () => { toast.success("Institution onboarding request submitted"); setForm((current) => ({ ...current, institutionName: "", domain: "", contactTitle: "" })); },
    onError: (error) => toast.error(error.message),
  });
  return <div className="mx-auto w-full max-w-2xl animate-fade-up"><header className="border-b border-ink-300 pb-6"><p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Institution onboarding</p><h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Request an institution tenant</h1><p className="mt-2 text-sm text-slate-300">An administrator reviews the domain before the institution becomes active on NexusWork.</p></header><Card className="mt-6"><CardHeader><CardTitle>Institution details</CardTitle><CardDescription>Use the institution’s official email domain, without https://.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="institution-name">Institution name</Label><Input id="institution-name" className="mt-2" value={form.institutionName} onChange={update("institutionName")} placeholder="University of Gondar" /></div><div><Label htmlFor="institution-domain">Official domain</Label><Input id="institution-domain" className="mt-2" value={form.domain} onChange={update("domain")} placeholder="uog.edu.et" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="contact-name">Contact name</Label><Input id="contact-name" className="mt-2" value={form.contactName} onChange={update("contactName")} /></div><div><Label htmlFor="contact-title">Contact title</Label><Input id="contact-title" className="mt-2" value={form.contactTitle} onChange={update("contactTitle")} placeholder="Registrar" /></div></div><div><Label htmlFor="contact-email">Contact email</Label><Input id="contact-email" className="mt-2" type="email" value={form.contactEmail} onChange={update("contactEmail")} /></div><Button loading={submit.isPending} disabled={submit.isPending || Object.values(form).some((value) => !value.trim())} onClick={() => submit.mutate()}>Submit onboarding request</Button></CardContent></Card></div>;
}

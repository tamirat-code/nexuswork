import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, CreditCard, Globe2, Plus, ShieldCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.js";
import { createOrganization, inviteOrganizationMember, listInstitutions, listMyOrganizations, listOrganizationMembers, removeOrganizationMember, updateOrganizationMember } from "../../services/api/organizations.api.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";

const roleLabels = { admin: "Admin", recruiter: "Recruiter", billing_viewer: "Billing viewer" };

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="rounded-control border border-ink-300 bg-ink-50 p-4"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-300"><Icon className="h-4 w-4 text-brass" aria-hidden="true" />{label}</div><p className="mt-2 text-xl font-semibold text-slate">{value}</p><p className="mt-1 text-xs text-slate-400">{hint}</p></div>;
}

export default function OrganizationsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [billingMode, setBillingMode] = useState("escrow");
  const [institutionId, setInstitutionId] = useState("none");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");

  const organizations = useQuery({ queryKey: ["organizations", "mine"], queryFn: () => listMyOrganizations(token), enabled: Boolean(token) });
  const orgs = organizations.data?.data || [];
  const institutions = useQuery({ queryKey: ["institutions", "active"], queryFn: () => listInstitutions(token), enabled: Boolean(token) });
  const selected = orgs.find((org) => String(org._id) === String(selectedId)) || orgs[0];
  const organizationId = selected?._id;
  const members = useQuery({ queryKey: ["organization-members", organizationId], queryFn: () => listOrganizationMembers(organizationId, token), enabled: Boolean(organizationId) });
  const currentMembership = selected?.membership;
  const isAdmin = currentMembership?.role === "admin";
  const memberCount = members.data?.data?.length || 0;

  const create = useMutation({
    mutationFn: () => createOrganization({ name: name.trim(), billing_mode: billingMode, institution_id: institutionId === "none" ? null : institutionId }, token),
    onSuccess: ({ data }) => { qc.invalidateQueries({ queryKey: ["organizations", "mine"] }); setName(""); setSelectedId(data._id); toast.success("Organization workspace created"); },
    onError: (error) => toast.error(error.message),
  });
  const invite = useMutation({
    mutationFn: () => inviteOrganizationMember(organizationId, { email: inviteEmail.trim(), role: inviteRole }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }); setInviteEmail(""); toast.success("Member added to workspace"); },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (userId) => removeOrganizationMember(organizationId, userId, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }); toast.success("Member removed"); },
    onError: (error) => toast.error(error.message),
  });
  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => updateOrganizationMember(organizationId, userId, { role }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="w-full animate-fade-up space-y-6">
      <header className="relative overflow-hidden rounded-card border border-ink-300 bg-ink-900 px-6 py-8 shadow-card sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brass/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">Organization workspace</p><h1 className="mt-2 font-display text-3xl tracking-tight text-slate sm:text-4xl">Your operating teams</h1><p className="mt-3 text-sm leading-6 text-slate-300">Centralize members, billing context, and institution relationships across every client workspace you manage.</p></div>
          <div className="flex items-center gap-2 rounded-control border border-escrow/30 bg-escrow/10 px-3 py-2 text-xs font-medium text-escrow"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Workspace services operational</div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Building2} label="Workspaces" value={organizations.isLoading ? "—" : orgs.length} hint="Active organizations" />
        <Stat icon={Users} label="People" value={members.isLoading ? "—" : memberCount} hint={selected ? `In ${selected.name}` : "Select a workspace"} />
        <Stat icon={ShieldCheck} label="Access model" value="Scoped" hint="Role-based membership" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.5fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-ink-300"><CardTitle>Your organizations</CardTitle><CardDescription className="mt-1">Select a workspace to manage access and members.</CardDescription></CardHeader>
            <CardContent className="space-y-2 pt-5">
              {organizations.isLoading && <div className="space-y-2"><div className="h-16 animate-pulse rounded-control bg-ink-700" /><div className="h-16 animate-pulse rounded-control bg-ink-700" /></div>}
              {organizations.isError && <p className="rounded-control border border-brick/30 bg-brick/10 p-3 text-sm text-brick">Unable to load your organizations. Refresh and try again.</p>}
              {!organizations.isLoading && !organizations.isError && orgs.length === 0 && <div className="rounded-control border border-dashed border-ink-300 p-4 text-sm text-slate-300">You do not belong to an organization yet. Create your first workspace below.</div>}
              {orgs.map((org) => <button type="button" key={org._id} onClick={() => setSelectedId(org._id)} className={`w-full rounded-control border p-4 text-left transition-colors ${String(org._id) === String(organizationId) ? "border-brass bg-brass/10 shadow-sm" : "border-ink-300 bg-ink-50 hover:border-brass/50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate">{org.name}</p><p className="mt-1 text-xs text-slate-300">{org.institution_id?.name || "Independent workspace"}</p></div><Badge variant={String(org._id) === String(organizationId) ? "outline" : "secondary"}>{roleLabels[org.membership?.role] || org.membership?.role}</Badge></div></button>)}
            </CardContent>
          </Card>

          {(user?.role === "client" || user?.role === "admin") && <Card className="border-brass/25">
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-control bg-brass/10 p-2 text-brass"><Plus className="h-5 w-5" aria-hidden="true" /></div><div><CardTitle>Create workspace</CardTitle><CardDescription className="mt-1">Set up a new client operating environment.</CardDescription></div></div></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="organization-name">Workspace name</Label><Input id="organization-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Rose Technologies" /></div>
              <div><Label htmlFor="institution-tenant">Institution relationship <span className="font-normal text-slate-400">(optional)</span></Label><Select value={institutionId} onValueChange={setInstitutionId}><SelectTrigger id="institution-tenant" className="mt-2"><SelectValue placeholder="Select an institution" /></SelectTrigger><SelectContent><SelectItem value="none">Independent workspace</SelectItem>{institutions.data?.data?.map((institution) => <SelectItem key={institution._id} value={institution._id}>{institution.name}</SelectItem>)}</SelectContent></Select><p className="mt-1.5 text-xs leading-5 text-slate-400">Connect this workspace to an approved institution tenant when required.</p></div>
              <div><Label htmlFor="billing-mode">Billing model</Label><Select value={billingMode} onValueChange={setBillingMode}><SelectTrigger id="billing-mode" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escrow">Escrow billing</SelectItem><SelectItem value="consolidated_invoice">Consolidated invoice</SelectItem></SelectContent></Select></div>
              <Button className="w-full" disabled={!name.trim() || create.isPending} loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" />Create workspace</Button>
            </CardContent>
          </Card>}
        </div>

        <Card className="min-h-[480px]">
          {!selected ? <CardContent className="flex min-h-[480px] flex-col items-center justify-center text-center"><div className="rounded-full bg-brass/10 p-4 text-brass"><Building2 className="h-8 w-8" aria-hidden="true" /></div><h2 className="mt-5 font-display text-2xl text-slate">Your workspace awaits</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">Create or join an organization to manage members, hiring access, and institution context in one place.</p></CardContent> : <>
            <CardHeader className="border-b border-ink-300"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-brass" aria-hidden="true" /><CardTitle>{selected.name}</CardTitle></div><div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300"><span className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" aria-hidden="true" />{selected.institution_id?.domain || "Independent workspace"}</span>{selected.institution_id?.name && <><span className="text-ink-300">·</span><span>{selected.institution_id.name}</span></>}</div></div><Badge variant="outline">{roleLabels[currentMembership?.role] || currentMembership?.role}</Badge></div></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">Workspace status</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-escrow"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Active</p></div><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">Members</p><p className="mt-1 text-sm font-semibold text-slate">{memberCount} active</p></div><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">Billing</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate"><CreditCard className="h-4 w-4 text-brass" aria-hidden="true" />{selected.billing_mode === "consolidated_invoice" ? "Consolidated" : "Escrow"}</p></div></div>
              {isAdmin && <div className="rounded-card border border-brass/20 bg-brass/5 p-5"><div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-brass" aria-hidden="true" /><p className="font-semibold text-slate">Add a client team member</p></div><p className="mt-1 text-xs text-slate-300">Invite an existing NexusWork client and assign their workspace role.</p><div className="mt-4 flex flex-col gap-2 lg:flex-row"><Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="member@example.com" aria-label="Member email" /><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="recruiter">Recruiter</SelectItem><SelectItem value="billing_viewer">Billing viewer</SelectItem></SelectContent></Select><Button disabled={!inviteEmail.trim() || invite.isPending} loading={invite.isPending} onClick={() => invite.mutate()}>Invite member</Button></div></div>}
              <div><div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold text-slate">Workspace members</h3><p className="mt-1 text-xs text-slate-300">People with access to this organization.</p></div><Badge variant="secondary">{memberCount} members</Badge></div><div className="space-y-2">{members.isLoading && <p className="rounded-control border border-ink-300 p-4 text-sm text-slate-300">Loading members…</p>}{members.data?.data?.map((membership) => <div key={membership._id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink-300 bg-ink-50 p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/15 text-sm font-semibold text-brass">{(membership.user_id?.name || membership.user_id?.email || "?").charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate">{membership.user_id?.name || membership.user_id?.email}</p><p className="truncate text-xs text-slate-300">{membership.user_id?.email}</p></div></div><div className="flex items-center gap-2">{isAdmin ? <Select value={membership.role} onValueChange={(role) => changeRole.mutate({ userId: membership.user_id._id, role })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="recruiter">Recruiter</SelectItem><SelectItem value="billing_viewer">Billing viewer</SelectItem></SelectContent></Select> : <Badge variant="secondary">{roleLabels[membership.role]}</Badge>}{isAdmin && String(membership.user_id?._id) !== String(user?._id) && <Button variant="ghost" size="icon" aria-label={`Remove ${membership.user_id?.name || "member"}`} onClick={() => remove.mutate(membership.user_id._id)}><UserMinus className="h-4 w-4 text-brick" /></Button>}</div></div>)}</div></div>
            </CardContent>
          </>}
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, UserMinus, UserPlus } from "lucide-react";
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

export default function OrganizationsPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [billingMode, setBillingMode] = useState("escrow");
  const [institutionId, setInstitutionId] = useState("none");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");

  const organizations = useQuery({ queryKey: ["organizations", "mine"], queryFn: () => listMyOrganizations(token) });
  const orgs = organizations.data?.data || [];
  const institutions = useQuery({ queryKey: ["institutions", "active"], queryFn: () => listInstitutions(token), enabled: Boolean(token) });
  const selected = orgs.find((org) => String(org._id) === String(selectedId)) || orgs[0];
  const organizationId = selected?._id;
  const members = useQuery({ queryKey: ["organization-members", organizationId], queryFn: () => listOrganizationMembers(organizationId, token), enabled: Boolean(organizationId) });
  const currentMembership = selected?.membership;
  const isAdmin = currentMembership?.role === "admin";

  const create = useMutation({
    mutationFn: () => createOrganization({ name: name.trim(), billing_mode: billingMode, institution_id: institutionId === "none" ? null : institutionId }, token),
    onSuccess: ({ data }) => { qc.invalidateQueries({ queryKey: ["organizations", "mine"] }); setName(""); setSelectedId(data._id); toast.success("Organization created"); },
    onError: (error) => toast.error(error.message),
  });
  const invite = useMutation({
    mutationFn: () => inviteOrganizationMember(organizationId, { email: inviteEmail.trim(), role: inviteRole }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }); setInviteEmail(""); toast.success("Member added"); },
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
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Organization workspace</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Teams and institutions</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Manage organization membership and keep client work scoped to the right team.</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader><CardTitle>Your organizations</CardTitle><CardDescription>Select a team to manage its members.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {organizations.isLoading && <p className="text-sm text-slate-300">Loading organizations…</p>}
            {!organizations.isLoading && orgs.length === 0 && <p className="text-sm text-slate-300">You do not belong to an organization yet.</p>}
            {orgs.map((org) => <button type="button" key={org._id} onClick={() => setSelectedId(org._id)} className={`w-full rounded-control border p-3 text-left ${String(org._id) === String(organizationId) ? "border-brass bg-brass/10" : "border-ink-300 hover:border-brass/50"}`}><p className="font-semibold text-slate">{org.name}</p><p className="mt-1 text-xs text-slate-300">{roleLabels[org.membership?.role] || org.membership?.role}</p></button>)}
            {(user?.role === "client" || user?.role === "admin") && <div className="border-t border-ink-300 pt-4"><Label htmlFor="organization-name">Create organization</Label><Input id="organization-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Organization name" /><Select value={institutionId} onValueChange={setInstitutionId}><SelectTrigger className="mt-2"><SelectValue placeholder="Institution tenant (optional)" /></SelectTrigger><SelectContent><SelectItem value="none">No institution tenant</SelectItem>{institutions.data?.data?.map((institution) => <SelectItem key={institution._id} value={institution._id}>{institution.name}</SelectItem>)}</SelectContent></Select><Select value={billingMode} onValueChange={setBillingMode}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escrow">Escrow billing</SelectItem><SelectItem value="consolidated_invoice">Consolidated invoice</SelectItem></SelectContent></Select><Button className="mt-3 w-full" size="sm" disabled={!name.trim() || create.isPending} loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" /> Create</Button></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-brass" />{selected?.name || "Organization members"}</CardTitle><CardDescription>{selected?.institution_id?.name || "No institution tenant assigned"}</CardDescription></div>{selected && <Badge variant="outline">{roleLabels[currentMembership?.role] || currentMembership?.role}</Badge>}</div></CardHeader>
          <CardContent>
            {!selected && <p className="text-sm text-slate-300">Create or join an organization to manage members.</p>}
            {selected && <>
              {isAdmin && <div className="mb-6 rounded-card border border-ink-300 bg-ink-700 p-4"><p className="flex items-center gap-2 font-semibold text-slate"><UserPlus className="h-4 w-4 text-brass" /> Add an existing client account</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="member@example.com" /><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="recruiter">Recruiter</SelectItem><SelectItem value="billing_viewer">Billing viewer</SelectItem></SelectContent></Select><Button disabled={!inviteEmail.trim() || invite.isPending} loading={invite.isPending} onClick={() => invite.mutate()}>Invite</Button></div></div>}
              <div className="space-y-2">{members.isLoading && <p className="text-sm text-slate-300">Loading members…</p>}{members.data?.data?.map((membership) => <div key={membership._id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink-300 p-3"><div><p className="font-semibold text-slate">{membership.user_id?.name || membership.user_id?.email}</p><p className="text-xs text-slate-300">{membership.user_id?.email}</p></div><div className="flex items-center gap-2">{isAdmin ? <Select value={membership.role} onValueChange={(role) => changeRole.mutate({ userId: membership.user_id._id, role })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="recruiter">Recruiter</SelectItem><SelectItem value="billing_viewer">Billing viewer</SelectItem></SelectContent></Select> : <Badge variant="secondary">{roleLabels[membership.role]}</Badge>}{isAdmin && String(membership.user_id?._id) !== String(user?._id) && <Button variant="ghost" size="icon" aria-label={`Remove ${membership.user_id?.name || "member"}`} onClick={() => remove.mutate(membership.user_id._id)}><UserMinus className="h-4 w-4 text-brick" /></Button>}</div></div>)}</div>
            </>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

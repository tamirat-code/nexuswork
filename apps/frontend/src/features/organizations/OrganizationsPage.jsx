import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, CreditCard, FileText, Globe2, Plus, ShieldCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth.js";
import { createOrganization, inviteOrganizationMember, listInstitutions, listMyOrganizations, listOrganizationMembers, removeOrganizationMember, updateOrganization, updateOrganizationMember } from "../../services/api/organizations.api.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button, buttonVariants } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";
import OrganizationAuditPanel from "./OrganizationAuditPanel.jsx";
import OrganizationSsoSettings from "./OrganizationSsoSettings.jsx";

const roleFallbacks = { admin: "Admin", recruiter: "Recruiter", billing_viewer: "Billing viewer" };

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="rounded-control border border-border-subtle bg-surface-soft p-4"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-content-secondary"><Icon className="h-4 w-4 text-brand" aria-hidden="true" />{label}</div><p className="mt-2 text-xl font-semibold text-content-primary">{value}</p><p className="mt-1 text-xs text-content-muted">{hint}</p></div>;
}

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [billingMode, setBillingMode] = useState("escrow");
  const [institutionId, setInstitutionId] = useState("none");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");
  const [settingsName, setSettingsName] = useState("");
  const [settingsInstitutionId, setSettingsInstitutionId] = useState("none");
  const [settingsBillingMode, setSettingsBillingMode] = useState("escrow");

  const roleLabels = {
    admin: t("organizations.roles.admin", { defaultValue: roleFallbacks.admin }),
    recruiter: t("organizations.roles.recruiter", { defaultValue: roleFallbacks.recruiter }),
    billing_viewer: t("organizations.roles.billing_viewer", { defaultValue: roleFallbacks.billing_viewer }),
  };

  const organizations = useQuery({ queryKey: ["organizations", "mine"], queryFn: () => listMyOrganizations(token), enabled: Boolean(token) });
  const orgs = organizations.data?.data || [];
  const institutions = useQuery({ queryKey: ["institutions", "active"], queryFn: () => listInstitutions(token), enabled: Boolean(token) });
  const selected = orgs.find((org) => String(org._id) === String(selectedId)) || orgs[0];
  const organizationId = selected?._id;
  const members = useQuery({ queryKey: ["organization-members", organizationId], queryFn: () => listOrganizationMembers(organizationId, token), enabled: Boolean(organizationId) });
  const currentMembership = selected?.membership;
  const isAdmin = currentMembership?.role === "admin";
  const memberCount = members.data?.data?.length || 0;
  const activeInstitutions = institutions.data?.data || [];
  const settingsChanged = Boolean(selected) && (
    settingsName.trim() !== selected.name ||
    settingsBillingMode !== selected.billing_mode ||
    settingsInstitutionId !== (selected.institution_id?._id || "none")
  );

  useEffect(() => {
    if (!selected) return;
    setSettingsName(selected.name || "");
    setSettingsInstitutionId(selected.institution_id?._id || "none");
    setSettingsBillingMode(selected.billing_mode || "escrow");
  }, [selected?._id, selected?.name, selected?.institution_id?._id, selected?.billing_mode]);

  const create = useMutation({
    mutationFn: () => createOrganization({ name: name.trim(), billing_mode: billingMode, institution_id: institutionId === "none" ? null : institutionId }, token),
    onSuccess: ({ data }) => { qc.invalidateQueries({ queryKey: ["organizations", "mine"] }); setName(""); setSelectedId(data._id); toast.success(t("organizations.workspaceCreated", { defaultValue: "Organization workspace created" })); },
    onError: (error) => toast.error(error.message),
  });
  const saveSettings = useMutation({
    mutationFn: () => updateOrganization(organizationId, { name: settingsName.trim(), billing_mode: settingsBillingMode, institution_id: settingsInstitutionId === "none" ? null : settingsInstitutionId }, token),
    onSuccess: ({ data }) => { qc.invalidateQueries({ queryKey: ["organizations", "mine"] }); setSelectedId(data._id); toast.success(t("organizations.workspaceUpdated", { defaultValue: "Workspace settings updated" })); },
    onError: (error) => toast.error(error.message),
  });
  const invite = useMutation({
    mutationFn: () => inviteOrganizationMember(organizationId, { email: inviteEmail.trim(), role: inviteRole }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }); setInviteEmail(""); toast.success(t("organizations.memberAdded", { defaultValue: "Member added to workspace" })); },
    onError: (error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (userId) => removeOrganizationMember(organizationId, userId, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }); toast.success(t("organizations.memberRemoved", { defaultValue: "Member removed" })); },
    onError: (error) => toast.error(error.message),
  });
  const changeRole = useMutation({
    mutationFn: ({ userId, role }) => updateOrganizationMember(organizationId, userId, { role }, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }),
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="w-full animate-fade-up space-y-6">
      <header className="relative overflow-hidden rounded-card border border-border-subtle bg-surface-soft px-6 py-8 shadow-card sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-soft blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{t("organizations.workspace", { defaultValue: "Organization workspace" })}</p><h1 className="mt-2 font-display text-3xl tracking-tight text-content-primary sm:text-4xl">{t("organizations.title", { defaultValue: "Your operating teams" })}</h1><p className="mt-3 text-sm leading-6 text-content-secondary">{t("organizations.description", { defaultValue: "Centralize members, billing context, and institution relationships across every client workspace you manage." })}</p></div>
          <div className="flex items-center gap-2 rounded-control border border-success/30 bg-success-soft px-3 py-2 text-xs font-medium text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("organizations.servicesOperational", { defaultValue: "Workspace services operational" })}</div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Building2} label={t("organizations.workspaces", { defaultValue: "Workspaces" })} value={organizations.isLoading ? "--" : orgs.length} hint={t("organizations.activeOrganizations", { defaultValue: "Active organizations" })} />
        <Stat icon={Users} label={t("organizations.people", { defaultValue: "People" })} value={members.isLoading ? "--" : memberCount} hint={selected ? t("organizations.inWorkspace", { name: selected.name, defaultValue: `In ${selected.name}` }) : t("organizations.selectWorkspace", { defaultValue: "Select a workspace" })} />
        <Stat icon={ShieldCheck} label={t("organizations.accessModel", { defaultValue: "Access model" })} value={t("organizations.scoped", { defaultValue: "Scoped" })} hint={t("organizations.roleBasedMembership", { defaultValue: "Role-based membership" })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.5fr)]">
        <div className="space-y-6">
          <Card className="border-border-subtle bg-surface-soft">
            <CardHeader className="border-b border-border-subtle"><CardTitle>{t("organizations.yourOrganizations", { defaultValue: "Your organizations" })}</CardTitle><CardDescription className="mt-1">{t("organizations.selectManage", { defaultValue: "Select a workspace to manage access and members." })}</CardDescription></CardHeader>
            <CardContent className="space-y-2 pt-5">
              {organizations.isLoading && <div className="space-y-2"><div className="h-16 animate-pulse rounded-control bg-surface-muted" /><div className="h-16 animate-pulse rounded-control bg-surface-muted" /></div>}
              {organizations.isError && <p className="rounded-control border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{t("organizations.unableToLoad", { defaultValue: "Unable to load your organizations. Refresh and try again." })}</p>}
              {!organizations.isLoading && !organizations.isError && orgs.length === 0 && <div className="rounded-control border border-dashed border-border-subtle p-4 text-sm text-content-secondary">{t("organizations.emptyState", { defaultValue: "You do not belong to an organization yet. Create your first workspace below." })}</div>}
              {orgs.map((org) => <button type="button" key={org._id} onClick={() => setSelectedId(org._id)} className={`w-full rounded-control border p-4 text-left transition-colors ${String(org._id) === String(organizationId) ? "border-brand bg-brand-soft shadow-sm" : "border-border-subtle bg-surface hover:border-brand/50"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-content-primary">{org.name}</p><p className="mt-1 text-xs text-content-secondary">{org.institution_id?.name || t("organizations.independentWorkspace", { defaultValue: "Independent workspace" })}</p></div><Badge variant={String(org._id) === String(organizationId) ? "outline" : "secondary"}>{roleLabels[org.membership?.role] || org.membership?.role}</Badge></div></button>)}
            </CardContent>
          </Card>

          {(user?.role === "client" || user?.role === "admin") && <Card className="border-brand/25 bg-brand-soft">
            <CardHeader><div className="flex items-center gap-3"><div className="rounded-control bg-brand-soft p-2 text-brand"><Plus className="h-5 w-5" aria-hidden="true" /></div><div><CardTitle>{t("organizations.createWorkspace", { defaultValue: "Create workspace" })}</CardTitle><CardDescription className="mt-1">{t("organizations.createDescription", { defaultValue: "Set up a new client operating environment." })}</CardDescription></div></div></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="organization-name">{t("organizations.workspaceName", { defaultValue: "Workspace name" })}</Label><Input id="organization-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("organizations.workspacePlaceholder", { defaultValue: "e.g. Rose Technologies" })} /></div>
              <div><Label htmlFor="institution-tenant">{t("organizations.institutionRelationship", { defaultValue: "Institution relationship" })} <span className="font-normal text-slate-400">({t("organizations.optional", { defaultValue: "optional" })})</span></Label><Select value={institutionId} onValueChange={setInstitutionId}><SelectTrigger id="institution-tenant" className="mt-2"><SelectValue placeholder={t("organizations.selectInstitution", { defaultValue: "Select an institution" })} /></SelectTrigger><SelectContent><SelectItem value="none">{t("organizations.independentWorkspace", { defaultValue: "Independent workspace" })}</SelectItem>{activeInstitutions.map((institution) => <SelectItem key={institution._id} value={institution._id}>{institution.name}</SelectItem>)}</SelectContent></Select><p className="mt-1.5 text-xs leading-5 text-slate-400">{t("organizations.institutionHint", { defaultValue: "Connect this workspace to an approved institution tenant when required." })}</p></div>
              <div><Label htmlFor="billing-mode">{t("organizations.billingModel", { defaultValue: "Billing model" })}</Label><Select value={billingMode} onValueChange={setBillingMode}><SelectTrigger id="billing-mode" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escrow">{t("organizations.escrowBilling", { defaultValue: "Escrow billing" })}</SelectItem><SelectItem value="consolidated_invoice">{t("organizations.consolidatedInvoice", { defaultValue: "Consolidated invoice" })}</SelectItem></SelectContent></Select></div>
              <Button className="w-full" disabled={!name.trim() || create.isPending} loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" />{t("organizations.createWorkspace", { defaultValue: "Create workspace" })}</Button>
            </CardContent>
          </Card>}
        </div>

        <Card className="min-h-[480px]">
          {!selected ? <CardContent className="flex min-h-[480px] flex-col items-center justify-center text-center"><div className="rounded-full bg-brass/10 p-4 text-brass"><Building2 className="h-8 w-8" aria-hidden="true" /></div><h2 className="mt-5 font-display text-2xl text-slate">{t("organizations.workspaceAwaits", { defaultValue: "Your workspace awaits" })}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{t("organizations.workspaceAwaitsHint", { defaultValue: "Create or join an organization to manage members, hiring access, and institution context in one place." })}</p></CardContent> : <>
            <CardHeader className="border-b border-ink-300"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-brass" aria-hidden="true" /><CardTitle>{selected.name}</CardTitle></div><div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300"><span className="flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" aria-hidden="true" />{selected.institution_id?.domain || t("organizations.independentWorkspace", { defaultValue: "Independent workspace" })}</span>{selected.institution_id?.name && <><span className="text-ink-300">/</span><span>{selected.institution_id.name}</span></>}</div></div><Badge variant="outline">{roleLabels[currentMembership?.role] || currentMembership?.role}</Badge></div></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">{t("organizations.workspaceStatus", { defaultValue: "Workspace status" })}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-escrow"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{t("organizations.active", { defaultValue: "Active" })}</p></div><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">{t("organizations.members", { defaultValue: "Members" })}</p><p className="mt-1 text-sm font-semibold text-slate">{t("organizations.activeMembers", { count: memberCount, defaultValue: `${memberCount} active` })}</p></div><div className="rounded-control bg-ink-700 p-3"><p className="text-xs text-slate-300">{t("organizations.billing", { defaultValue: "Billing" })}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate"><CreditCard className="h-4 w-4 text-brass" aria-hidden="true" />{selected.billing_mode === "consolidated_invoice" ? t("organizations.consolidated", { defaultValue: "Consolidated" }) : t("organizations.escrow", { defaultValue: "Escrow" })}</p></div></div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                <div className="rounded-card border border-ink-300 bg-ink-50 p-5">
                  <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-slate">{t("organizations.settings", { defaultValue: "Workspace settings" })}</h3><p className="mt-1 text-xs text-slate-300">{t("organizations.settingsDescription", { defaultValue: "Control the organization identity, institution relationship, and billing model." })}</p></div>{selected.institution_id ? <Badge variant="outline">{t("organizations.institutionLinked", { defaultValue: "Institution linked" })}</Badge> : <Badge variant="secondary">{t("organizations.independent", { defaultValue: "Independent" })}</Badge>}</div>
                  {isAdmin ? <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div><Label htmlFor="settings-name">{t("organizations.name", { defaultValue: "Name" })}</Label><Input id="settings-name" className="mt-2" value={settingsName} onChange={(event) => setSettingsName(event.target.value)} /></div>
                    <div><Label htmlFor="settings-institution">{t("organizations.institution", { defaultValue: "Institution" })}</Label><Select value={settingsInstitutionId} onValueChange={setSettingsInstitutionId}><SelectTrigger id="settings-institution" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">{t("organizations.independentWorkspace", { defaultValue: "Independent workspace" })}</SelectItem>{activeInstitutions.map((institution) => <SelectItem key={institution._id} value={institution._id}>{institution.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="settings-billing">{t("organizations.billing", { defaultValue: "Billing" })}</Label><Select value={settingsBillingMode} onValueChange={setSettingsBillingMode}><SelectTrigger id="settings-billing" className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="escrow">{t("organizations.escrowBilling", { defaultValue: "Escrow billing" })}</SelectItem><SelectItem value="consolidated_invoice">{t("organizations.consolidatedInvoice", { defaultValue: "Consolidated invoice" })}</SelectItem></SelectContent></Select></div>
                    <div className="md:col-span-3 flex justify-end"><Button disabled={!settingsChanged || !settingsName.trim() || saveSettings.isPending} loading={saveSettings.isPending} onClick={() => saveSettings.mutate()}>{t("organizations.saveSettings", { defaultValue: "Save settings" })}</Button></div>
                  </div> : <p className="mt-4 rounded-control border border-ink-300 bg-ink-700 p-3 text-sm text-slate-300">{t("organizations.adminsOnly", { defaultValue: "Only workspace admins can edit these settings." })}</p>}
                </div>
                <div className="rounded-card border border-brass/20 bg-brass/5 p-5">
                  <h3 className="font-semibold text-slate">{t("organizations.nextWorkflow", { defaultValue: "Next in the workflow" })}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{t("organizations.nextWorkflowHint", { defaultValue: "After the workspace is ready, move into hiring and delivery." })}</p>
                  <div className="mt-4 space-y-2">
                    <Link className={buttonVariants({ className: "w-full justify-between" })} to="/projects/new"><span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />{t("organizations.postProject", { defaultValue: "Post project" })}</span><ArrowRight className="h-4 w-4" /></Link>
                    <Link className={buttonVariants({ variant: "secondary", className: "w-full justify-between" })} to="/proposals"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4" />{t("organizations.reviewProposals", { defaultValue: "Review proposals" })}</span><ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </div>
              {isAdmin && <div className="rounded-card border border-brass/20 bg-brass/5 p-5"><div className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-brass" aria-hidden="true" /><p className="font-semibold text-slate">{t("organizations.addMember", { defaultValue: "Add a client team member" })}</p></div><p className="mt-1 text-xs text-slate-300">{t("organizations.addMemberHint", { defaultValue: "Invite an existing NexusWork client and assign their workspace role." })}</p><div className="mt-4 flex flex-col gap-2 lg:flex-row"><Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder={t("organizations.memberEmailPlaceholder", { defaultValue: "member@example.com" })} aria-label={t("organizations.memberEmailPlaceholder", { defaultValue: "member@example.com" })} /><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{roleLabels.admin}</SelectItem><SelectItem value="recruiter">{roleLabels.recruiter}</SelectItem><SelectItem value="billing_viewer">{roleLabels.billing_viewer}</SelectItem></SelectContent></Select><Button disabled={!inviteEmail.trim() || invite.isPending} loading={invite.isPending} onClick={() => invite.mutate()}>{t("organizations.inviteMember", { defaultValue: "Invite member" })}</Button></div></div>}
              <div><div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold text-slate">{t("organizations.workspaceMembers", { defaultValue: "Workspace members" })}</h3><p className="mt-1 text-xs text-slate-300">{t("organizations.workspaceMembersHint", { defaultValue: "People with access to this organization." })}</p></div><Badge variant="secondary">{t("organizations.members", { defaultValue: "Members" })}: {memberCount}</Badge></div><div className="space-y-2">{members.isLoading && <p className="rounded-control border border-ink-300 p-4 text-sm text-slate-300">{t("organizations.loadingMembers", { defaultValue: "Loading members..." })}</p>}{members.data?.data?.map((membership) => <div key={membership._id} className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ink-300 bg-ink-50 p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/15 text-sm font-semibold text-brass">{(membership.user_id?.name || membership.user_id?.email || "?").charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate">{membership.user_id?.name || membership.user_id?.email}</p><p className="truncate text-xs text-slate-300">{membership.user_id?.email}</p></div></div><div className="flex items-center gap-2">{isAdmin ? <Select value={membership.role} onValueChange={(role) => changeRole.mutate({ userId: membership.user_id._id, role })}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">{roleLabels.admin}</SelectItem><SelectItem value="recruiter">{roleLabels.recruiter}</SelectItem><SelectItem value="billing_viewer">{roleLabels.billing_viewer}</SelectItem></SelectContent></Select> : <Badge variant="secondary">{roleLabels[membership.role]}</Badge>}{isAdmin && String(membership.user_id?._id) !== String(user?._id) && <Button variant="ghost" size="icon" aria-label={t("organizations.removeMemberLabel", { name: membership.user_id?.name || "member", defaultValue: `Remove ${membership.user_id?.name || "member"}` })} onClick={() => remove.mutate(membership.user_id._id)}><UserMinus className="h-4 w-4 text-brick" /></Button>}</div></div>)}</div></div>
            </CardContent>
          </>}
        </Card>
      </div>
      {isAdmin && organizationId && <OrganizationAuditPanel organizationId={organizationId} token={token} />}
      {isAdmin && organizationId && <OrganizationSsoSettings organizationId={organizationId} token={token} />}
    </div>
  );
}

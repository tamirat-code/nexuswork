import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ShieldCheck, Users, Flag, Briefcase, GraduationCap, Plus, Pencil, Trash2, Scale, TrendingUp, Wallet, UserCheck, FileText, XCircle, BadgeCheck, LayoutDashboard, Tag, ScrollText, Eye } from "lucide-react";

import { listAdminStats, listAdminUsers, getAdminUserProfile, listAdminDisputes, resolveAdminDispute, listAdminReports, reviewAdminReport, suspendAdminUser, restoreAdminUser, changeAdminUserRole, deleteAdminUser } from "../../services/api/admin.api.js";
import { listUniversities, createUniversity, updateUniversity, deleteUniversity } from "../../services/api/universities.api.js";
import { getStaffVerifications, reviewStaffVerification } from "../../services/api/staff-verifications.api.js";
import { openFilePreview } from "../../services/api/files.api.js";
import { displayFilename } from "../../utils/filename.utils.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { formatDate } from "../../utils/date.utils.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/shadcn/table.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";
import BarChart from "../../components/charts/BarChart.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/shadcn/tabs.jsx";
import CategoriesManager from "./CategoriesManager.jsx";
import AuditLogViewer from "./AuditLogViewer.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/shadcn/dialog.jsx";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/shadcn/select.jsx";
import { reportValidation } from "../../lib/validation.js";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog.jsx";

function CreateUniversityDialog({ token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Enter the university name.";
    else if (name.trim().length > 200) next.name = "University name must be 200 characters or fewer.";
    if (!domain.trim()) next.domain = "Enter an email domain.";
    else if (domain.trim().length > 200 || !/^(?=.{1,200}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain.trim())) {
      next.domain = "Enter a valid domain such as aau.edu.et (without https://).";
    }
    setErrors(next);
    if (Object.keys(next).length) { reportValidation("University form contains invalid fields", { form: "create-university", fields: Object.keys(next) }); return false; }
    return true;
  }

  const create = useMutation({
    mutationFn: () => createUniversity({ name: name.trim(), domain: domain.trim() }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["universities"] });
      toast.success("University created");
      setName(""); setDomain(""); setErrors({});
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not create university"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add university
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a university</DialogTitle>
          <DialogDescription>
            Students with a matching email domain can request identity verification against this institution.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uni-name">Name</Label>
            <Input id="uni-name" value={name} maxLength={200} aria-invalid={Boolean(errors.name)} onChange={(e) => { setName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }} placeholder="Addis Ababa University" />
            {errors.name && <p className="text-xs text-brick" role="alert">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uni-domain">Email domain</Label>
            <Input id="uni-domain" value={domain} maxLength={200} aria-invalid={Boolean(errors.domain)} onChange={(e) => { setDomain(e.target.value.toLowerCase()); setErrors((v) => ({ ...v, domain: undefined })); }} placeholder="aau.edu.et" />
            {errors.domain && <p className="text-xs text-brick" role="alert">{errors.domain}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button
            loading={create.isPending}
            disabled={create.isPending}
            onClick={() => validate() && create.mutate()}
          >
            Create university
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUniversityDialog({ university, token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(university.name);
  const [domain, setDomain] = useState(university.domain);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Enter the university name.";
    if (!domain.trim() || !/^(?=.{1,200}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain.trim())) {
      next.domain = "Enter a valid domain such as aau.edu.et (without https://).";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const update = useMutation({
    mutationFn: () => updateUniversity(university._id, { name: name.trim(), domain: domain.trim().toLowerCase() }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["universities"] });
      toast.success("University updated");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not update university"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Edit ${university.name}`}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit university</DialogTitle><DialogDescription>Update the institution name or verified email domain.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor={`edit-uni-name-${university._id}`}>Name</Label><Input id={`edit-uni-name-${university._id}`} value={name} maxLength={200} onChange={(e) => { setName(e.target.value); setErrors((v) => ({ ...v, name: undefined })); }} />{errors.name && <p className="text-xs text-brick" role="alert">{errors.name}</p>}</div>
          <div className="space-y-1.5"><Label htmlFor={`edit-uni-domain-${university._id}`}>Email domain</Label><Input id={`edit-uni-domain-${university._id}`} value={domain} maxLength={200} onChange={(e) => { setDomain(e.target.value.toLowerCase()); setErrors((v) => ({ ...v, domain: undefined })); }} />{errors.domain && <p className="text-xs text-brick" role="alert">{errors.domain}</p>}</div>
        </div>
        <DialogFooter><Button loading={update.isPending} onClick={() => validate() && update.mutate()}>Save changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUniversityButton({ university, token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteUniversity(university._id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["universities"] }); toast.success("University deleted"); setOpen(false); },
    onError: (err) => toast.error(err.message || "Could not delete university"),
  });

  return (
    <>
      <Button variant="destructive" size="sm" aria-label={`Delete ${university.name}`} onClick={() => setOpen(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
      <ConfirmDialog open={open} loading={remove.isPending} onCancel={() => setOpen(false)} onConfirm={() => remove.mutate()} tone="danger" confirmLabel="Delete university" title={`Delete ${university.name}?`} description="This is only allowed when no users or verification records are linked to this university." />
    </>
  );
}

const RESOLUTION_OUTCOMES = [
  { value: "resume_work", label: "Return to work", hint: "Restore the milestone and let both parties continue." },
  { value: "release_student", label: "Release funds to student", hint: "Student keeps the milestone payment." },
  { value: "refund_client", label: "Refund client", hint: "Return the milestone funds to the client." },
];

function ResolveDisputeDialog({ dispute, token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState("resume_work");

  const resolve = useMutation({
    mutationFn: () =>
      resolveAdminDispute(dispute._id, { resolution: resolution.trim(), outcome }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Dispute resolved");
      setResolution("");
      setOutcome("resume_work");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not resolve dispute"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 gap-1.5">
          <Scale className="h-3.5 w-3.5" /> Resolve
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve dispute</DialogTitle>
          <DialogDescription>
            {dispute.milestone_id?.title || "Milestone"} — {dispute.reason || "No reason provided"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`outcome-${dispute._id}`}>Decision</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger id={`outcome-${dispute._id}`}>
                <SelectValue placeholder="Choose outcome" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OUTCOMES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-300">
              {RESOLUTION_OUTCOMES.find((o) => o.value === outcome)?.hint}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`resolution-${dispute._id}`}>Resolution summary</Label>
            <Textarea
              id={`resolution-${dispute._id}`}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain the decision and next steps for both parties…"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            loading={resolve.isPending}
            disabled={resolution.trim().length < 10}
            onClick={() => resolve.mutate()}
          >
            Resolve dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportReviewAction({ report, token }) {
  const qc = useQueryClient();
  const review = useMutation({
    mutationFn: (status) => reviewAdminReport(report._id, { status }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Report updated"); },
    onError: (err) => toast.error(err.message || "Could not update report"),
  });
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="secondary" loading={review.isPending} onClick={() => review.mutate("dismissed")}>Dismiss</Button>
      <Button size="sm" loading={review.isPending} onClick={() => review.mutate("reviewed")}>Mark reviewed</Button>
    </div>
  );
}

function UserAdminActions({ account, token }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [nextRole, setNextRole] = useState(account.role || "student");
  const isDelete = open === "delete";
  const isRoleChange = open === "role";
  const action = useMutation({
    mutationFn: () => isDelete
      ? deleteAdminUser(account._id, reason.trim(), token)
      : isRoleChange
        ? changeAdminUserRole(account._id, { new_role: nextRole, reason: reason.trim() }, token)
        : account.status === "suspended"
          ? restoreAdminUser(account._id, reason.trim(), token)
          : suspendAdminUser(account._id, reason.trim(), token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(isDelete ? "User deleted" : isRoleChange ? "Role updated" : account.status === "suspended" ? "User restored" : "User suspended");
      setOpen(false); setReason("");
    },
    onError: (err) => toast.error(err.message || "Admin action failed"),
  });
  const title = isDelete ? "Delete user" : isRoleChange ? "Change user role" : account.status === "suspended" ? "Restore user" : "Suspend user";
  return (
    <>
      <div className="flex justify-end gap-1.5">
        <UserProfileDialog account={account} token={token} />
        <Button size="sm" variant="secondary" className="h-8" onClick={() => setOpen(account.status === "suspended" ? "restore" : "suspend")}>
          {account.status === "suspended" ? "Restore" : "Suspend"}
        </Button>
        <Button size="sm" variant="secondary" className="h-8" onClick={() => setOpen("role")}>Role</Button>
        <Button size="sm" variant="secondary" className="h-8 text-brick" onClick={() => setOpen("delete")}>Delete</Button>
      </div>
      <Dialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{account.name} · {account.email}</DialogDescription></DialogHeader>
          {isRoleChange && (
            <Select value={nextRole} onValueChange={setNextRole}>
              <SelectTrigger><SelectValue placeholder="Choose role" /></SelectTrigger>
              <SelectContent>
                {[["student", "Student"], ["client", "Client"], ["university_staff", "University staff"], ["admin", "Administrator"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (required)" rows={3} maxLength={500} />
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button loading={action.isPending} disabled={reason.trim().length < 3 || (isRoleChange && nextRole === account.role)} onClick={() => action.mutate()}>{title}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserProfileDialog({ account, token }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-user-profile", account._id],
    queryFn: () => getAdminUserProfile(account._id, token),
    enabled: open && !!token,
  });
  const profile = data?.data;
  const activities = profile?.recent_actions ?? [];

  return (
    <>
      <Button size="sm" variant="secondary" className="h-8" onClick={() => setOpen(true)} title="View profile and activity">
        <Eye className="h-3.5 w-3.5" /> View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{profile?.name || account.name}</DialogTitle>
            <DialogDescription>Account profile and recent activity</DialogDescription>
          </DialogHeader>
          {isLoading ? <Skeleton className="h-32 w-full" /> : isError ? <p className="text-sm text-brick">Could not load this user profile.</p> : profile && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-control border border-ink-300 bg-ink-50 p-4 text-sm sm:grid-cols-2">
                <div><span className="text-slate-400">Email</span><p className="font-medium text-slate">{profile.email}</p></div>
                <div><span className="text-slate-400">Role</span><p className="font-medium capitalize text-slate">{profile.role?.replaceAll("_", " ")}</p></div>
                <div><span className="text-slate-400">Status</span><p className="font-medium capitalize text-slate">{profile.status}</p></div>
                <div><span className="text-slate-400">Joined</span><p className="font-medium text-slate">{profile.createdAt ? formatDate(profile.createdAt) : "—"}</p></div>
                <div><span className="text-slate-400">Email verified</span><p className="font-medium text-slate">{profile.email_verified ? "Yes" : "No"}</p></div>
                <div><span className="text-slate-400">University verified</span><p className="font-medium text-slate">{profile.universityVerified ? "Yes" : "No"}</p></div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-slate">Recent activity</h3>
                {activities.length === 0 ? <p className="text-sm text-slate-400">No recorded activity for this user.</p> : (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity._id} className="rounded-control border border-ink-300 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium capitalize text-slate">{(activity.action_type || "activity").replaceAll("_", " ")}</span><span className="text-xs text-slate-400">{formatDate(activity.createdAt)}</span></div>
                        <p className="mt-1 text-xs text-slate-400">{activity.entity_type || "account"}{activity.reason ? ` · ${activity.reason}` : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// A university_staff account gets zero real power at registration — matching
// its email domain only made it eligible to apply. This is the only place in
// the app that turns a pending request into actual contact_staff membership
// (see staff-verifications.service.js reviewStaffVerification).
async function openPrivateFile(file, token) {
  try {
    await openFilePreview(file._id, token);
  } catch (error) {
    toast.error(error.message || "Could not open document");
  }
}

function ReviewStaffVerificationDialog({ verification, token, defaultOpen = false }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(defaultOpen);
  const [rejectionReason, setRejectionReason] = useState("");
  const [decision, setDecision] = useState(null); // "approved" | "rejected"

  const review = useMutation({
    mutationFn: (nextDecision) =>
      reviewStaffVerification(
        verification._id,
        { decision: nextDecision, rejection_reason: nextDecision === "rejected" ? rejectionReason.trim() : undefined },
        token
      ),
    onSuccess: (_, nextDecision) => {
      qc.invalidateQueries({ queryKey: ["admin-staff-verifications"] });
      toast.success(nextDecision === "approved" ? "Staff access approved" : "Request rejected");
      setRejectionReason("");
      setDecision(null);
      setOpen(false);
    },
    onError: (err) => toast.error(err.message || "Could not review this request"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDecision(null);
          setRejectionReason("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{verification.full_name}</DialogTitle>
          <DialogDescription>
            {verification.job_title} · {verification.department} · {verification.university_id?.name || "Unknown university"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-ink-300 bg-ink-100 p-3 text-xs text-slate-300">
            <p>
              Account email domain: <span className="font-mono text-slate">{verification.email_domain}</span>
              {verification.email_domain_matched ? (
                <span className="ml-2 text-escrow">matches university on file</span>
              ) : (
                <span className="ml-2 text-brick">does not match on file</span>
              )}
            </p>
          </div>

          {verification.document_file_id?.url ? (
            <button
              type="button"
              onClick={() => openPrivateFile(verification.document_file_id, token)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brass underline-offset-4 hover:underline"
            >
              <FileText className="h-4 w-4" />
              View uploaded document ({displayFilename(verification.document_file_id.original_name)})
            </button>
          ) : (
            <p className="text-sm text-brick">No document on file — reject and ask them to resubmit with proof.</p>
          )}

          {decision === "rejected" && (
            <div className="space-y-1.5">
              <Label htmlFor={`staff-rejection-${verification._id}`}>Reason (shown to the requester)</Label>
              <Textarea
                id={`staff-rejection-${verification._id}`}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The document doesn't show your name or job title clearly enough to confirm."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {decision !== "rejected" ? (
            <Button variant="secondary" onClick={() => setDecision("rejected")} disabled={review.isPending}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          ) : (
            <Button
              variant="secondary"
              loading={review.isPending}
              disabled={!rejectionReason.trim()}
              onClick={() => review.mutate("rejected")}
            >
              Confirm rejection
            </Button>
          )}
          <Button
            loading={review.isPending && decision !== "rejected"}
            disabled={decision === "rejected" || !verification.document_file_id}
            onClick={() => review.mutate("approved")}
          >
            <BadgeCheck className="h-4 w-4" /> Approve staff access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const focusStaffId = searchParams.get("staff_id");
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");
  const [userStatus, setUserStatus] = useState("all");

  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => listAdminStats(token), enabled: !!token });
  const userQuery = new URLSearchParams();
  if (userSearch.trim()) userQuery.set("search", userSearch.trim());
  if (userRole !== "all") userQuery.set("role", userRole);
  if (userStatus !== "all") userQuery.set("status", userStatus);
  const { data: usersData, isLoading: usersLoading } = useQuery({ queryKey: ["admin-users", userQuery.toString()], queryFn: () => listAdminUsers(`?${userQuery.toString()}`, token), enabled: !!token });
  const { data: disputesData, isLoading: disputesLoading } = useQuery({ queryKey: ["admin-disputes"], queryFn: () => listAdminDisputes("", token), enabled: !!token });
  const { data: reportsData, isLoading: reportsLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => listAdminReports("?status=open&limit=50", token), enabled: !!token });
  const { data: universitiesData, isLoading: universitiesLoading } = useQuery({ queryKey: ["universities"], queryFn: () => listUniversities() });
  const { data: staffVerificationsData, isLoading: staffVerificationsLoading } = useQuery({
    queryKey: ["admin-staff-verifications"],
    queryFn: () => getStaffVerifications("?status=pending&limit=50", token),
    enabled: !!token,
  });

  const stats = statsData?.data ?? {};
  const revenue = stats.revenue ?? {};
  const currency = revenue.currency?.toUpperCase() || "USD";
  const formatMultiCurrency = (values, fallback = 0) => {
    const entries = Object.entries(values || {});
    if (!entries.length) return formatCurrency(fallback, currency);
    return entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, value]) => formatCurrency(value, code.toUpperCase()))
      .join(" · ");
  };

  const users = Array.isArray(usersData?.data)
    ? usersData.data
    : usersData?.data?.users ?? [];

  const disputes = Array.isArray(disputesData?.data)
    ? disputesData.data
    : disputesData?.data?.disputes ?? [];
  const reports = reportsData?.data?.reports ?? [];

  const universities = universitiesData?.data ?? [];
  const staffVerifications = staffVerificationsData?.data ?? [];

  const statCards = [
    { label: "Active projects", value: stats.active_projects ?? 0, icon: Briefcase },
    { label: "Students", value: stats.students ?? 0, icon: Users },
    { label: "Active users", value: stats.users?.active_30d ?? 0, icon: UserCheck },
    { label: "Open disputes", value: stats.disputes?.open ?? 0, icon: Flag },
    { label: "Pending staff requests", value: staffVerifications.length, icon: ShieldCheck },
  ];

  const revenueCards = [
    {
      label: "Platform commission (all-time)",
      value: formatMultiCurrency(revenue.commission_by_currency, revenue.commission_total ?? 0),
      icon: ShieldCheck,
      highlight: true,
    },
    {
      label: "Commission (last 30 days)",
      value: formatMultiCurrency(revenue.commission_30d_by_currency, revenue.commission_30d ?? 0),
      icon: TrendingUp,
    },
    {
      label: "Escrow funds held",
      value: formatMultiCurrency(revenue.escrow_held_by_currency, revenue.escrow_held ?? 0),
      icon: Wallet,
    },
  ];

  return (
    <div className="w-full animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">{t("admin.eyebrow")}</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">{t("admin.title")}</h1>
        <p className="mt-2 text-sm text-slate-300">{t("admin.subtitle")}</p>
      </header>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4" /> {t("admin.tabDashboard")}</TabsTrigger>
          <TabsTrigger value="categories"><Tag className="h-4 w-4" /> {t("admin.tabCategories")}</TabsTrigger>
          <TabsTrigger value="audit-log"><ScrollText className="h-4 w-4" /> {t("admin.tabAuditLogs")}</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesManager />
        </TabsContent>

        <TabsContent value="audit-log">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <s.icon className="h-5 w-5 text-brass" />
              <p className="mt-3 font-mono text-2xl font-semibold text-slate">{statsLoading ? "…" : s.value}</p>
              <p className="text-xs text-slate-300">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {revenueCards.map((s) => (
          <Card key={s.label} className={s.highlight ? "border-brass/40" : undefined}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <s.icon className={s.highlight ? "h-5 w-5 text-brass" : "h-5 w-5 text-slate-300"} />
              </div>
              <p className={`mt-3 font-mono text-2xl font-semibold ${s.highlight ? "text-brass" : "text-slate"}`}>
                {statsLoading ? "…" : s.value}
              </p>
              <p className="text-xs text-slate-300">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Commission by currency</CardTitle>
          <CardDescription>Each currency is shown separately. Values are not converted or combined.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(revenue.commission_by_currency || {}).length === 0 ? (
            <p className="text-sm text-slate-300">No commission recorded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(revenue.commission_by_currency).sort(([a], [b]) => a.localeCompare(b)).map(([code, total]) => (
                <div key={code} className="rounded-xl border border-ink-300 bg-ink-50 p-4">
                  <p className="font-mono text-xs uppercase tracking-wide text-slate-300">{code}</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-brass">{formatCurrency(total, code.toUpperCase())}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Last 30 days: {formatCurrency(revenue.commission_30d_by_currency?.[code] || 0, code.toUpperCase())}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Commission revenue by month</CardTitle>
          <CardDescription>Platform's cut of released milestones, last 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <BarChart
              data={revenue.monthly ?? []}
              valueFormatter={(v) => formatCurrency(v, currency)}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">User reports</CardTitle>
            <CardDescription>Review reports submitted through user profiles.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Reported user</TableHead><TableHead>Reporter</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {reportsLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!reportsLoading && reports.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-300">No open reports</TableCell></TableRow>}
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell className="text-sm font-medium text-slate">{report.target_user_id?.name || "Unknown user"}<div className="text-xs font-normal text-slate-300">{report.target_user_id?.email}</div></TableCell>
                    <TableCell className="text-xs text-slate-300">{report.reporter_id?.name || report.reporter_id?.email || "Unknown"}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-xs text-slate-300" title={report.reason}>{report.reason}</TableCell>
                    <TableCell><ReportReviewAction report={report} token={token} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User management</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search name or email" className="h-9 max-w-xs" />
              <Select value={userRole} onValueChange={setUserRole}><SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="student">Students</SelectItem><SelectItem value="client">Clients</SelectItem><SelectItem value="university_staff">University staff</SelectItem><SelectItem value="admin">Admins</SelectItem></SelectContent></Select>
              <Select value={userStatus} onValueChange={setUserStatus}><SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="deactivated">Deactivated</SelectItem></SelectContent></Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {usersLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!usersLoading && users.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-300">No users found</TableCell></TableRow>}
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-semibold text-slate">{u.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{u.role?.replace("_", " ")}</Badge></TableCell>
                    <TableCell><Badge variant={u.status === "active" ? "success" : u.status === "suspended" ? "danger" : "secondary"}>{u.status || "unknown"}</Badge></TableCell>
                    <TableCell><UserAdminActions account={u} token={token} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Dispute queue</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputesLoading && <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!disputesLoading && disputes.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-300">No disputes</TableCell></TableRow>}
                {disputes.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell className="text-sm font-medium text-slate">{d.milestone_id?.title || "Milestone"}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-slate-300" title={d.reason}>{d.reason || "—"}</TableCell>
                    <TableCell><StatusBadge kind="dispute" status={d.status} showDot /></TableCell>
                    <TableCell className="text-right">
                      {d.status !== "resolved" ? (
                        <ResolveDisputeDialog dispute={d} token={token} />
                      ) : (
                        <Badge variant="success">Resolved</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Staff verification requests</CardTitle>
            <CardDescription>
              A matching email domain only made these accounts eligible to apply — they get no real access
              (reviewing students, certifying skills, analytics) until approved here.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffVerificationsLoading && (
                  <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                )}
                {!staffVerificationsLoading && staffVerifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-300">
                      No pending staff verification requests.
                    </TableCell>
                  </TableRow>
                )}
                {staffVerifications.map((v) => (
                  <TableRow
                    key={v._id}
                    className={v._id === focusStaffId ? "bg-brass/5" : undefined}
                  >
                    <TableCell className="font-semibold text-slate">
                      {v.full_name}
                      <div className="text-xs font-normal text-slate-300">{v.user_id?.email}</div>
                    </TableCell>
                    <TableCell className="flex items-center gap-2 text-sm text-slate">
                      <GraduationCap className="h-4 w-4 text-brass" /> {v.university_id?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">
                      {v.job_title}
                      <div className="text-xs text-slate-400">{v.department}</div>
                    </TableCell>
                    <TableCell>
                      {v.email_domain_matched ? (
                        <Badge variant="success">Domain matches</Badge>
                      ) : (
                        <Badge variant="danger">Domain mismatch</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ReviewStaffVerificationDialog
                        verification={v}
                        token={token}
                        defaultOpen={v._id === focusStaffId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Universities</CardTitle>
            <CreateUniversityDialog token={token} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Domain</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
                {universitiesLoading && <TableRow><TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell></TableRow>}
                {!universitiesLoading && universities.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-300">No universities yet — add one to enable student verification.</TableCell></TableRow>
                )}
                {universities.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="flex items-center gap-2 font-semibold text-slate"><GraduationCap className="h-4 w-4 text-brass" /> {u.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">{u.domain}</TableCell>
                    <TableCell><div className="flex justify-end gap-2"><EditUniversityDialog university={u} token={token} /><DeleteUniversityButton university={u} token={token} /></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

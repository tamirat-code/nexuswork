import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, GraduationCap, ShieldCheck, XCircle } from "lucide-react";
import { getVerifications, reviewVerification } from "../../services/api/verifications.api.js";
import { listUniversities } from "../../services/api/universities.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/shadcn/avatar.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/shadcn/tabs.jsx";
import { StatusBadge } from "../../components/ui/shadcn/status-badge.jsx";

function VerificationQueue({ token }) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => getVerifications("?status=pending", token),
    enabled: !!token,
  });
  const review = useMutation({
    mutationFn: ({ id, status }) => reviewVerification(id, { status }, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["verifications"] }); toast.success("Decision saved"); },
    onError: (err) => toast.error(err.message),
  });
  const items = data?.data ?? [];
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-brick">{error.message}</p>;
  if (!items.length) return (
    <Card className="p-10 text-center">
      <BadgeCheck className="mx-auto h-10 w-10 text-escrow" />
      <h3 className="mt-4 font-display text-lg text-slate">All caught up</h3>
      <p className="mt-2 text-sm text-slate-300">No pending verifications for this institution.</p>
    </Card>
  );
  return (
    <div className="space-y-4">
      {items.map((v) => (
        <Card key={v._id} className="animate-fade-up">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar><AvatarImage src={v.student_id?.avatar} alt="" /><AvatarFallback>{(v.student_id?.name || "S").slice(0, 2)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate">{v.student_id?.name || "Student"}</p>
                  <p className="truncate text-xs text-slate-300">{v.student_id?.email}</p>
                  <Badge variant="secondary" className="mt-1"><GraduationCap className="h-3 w-3" /> {v.student_id?.department || "Student"}</Badge>
                </div>
              </div>
              <StatusBadge kind="verification" status={v.status} showDot />
            </div>
            <div className="mt-4 rounded-control border border-ink-300 bg-ink-700 p-3 text-sm text-slate-300">
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brass" /> ID: <span className="font-mono">{v.id_document_number || "—"}</span></p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" loading={review.isPending} onClick={() => review.mutate({ id: v._id, status: "verified" })}><BadgeCheck className="h-4 w-4" /> Approve</Button>
              <Button size="sm" variant="danger" onClick={() => review.mutate({ id: v._id, status: "rejected" })}><XCircle className="h-4 w-4" /> Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function UniversitiesPage() {
  const { token, user } = useAuth();
  const isStaff = user?.role === "university_staff";
  const { data } = useQuery({ queryKey: ["universities"], queryFn: () => listUniversities("?limit=5") });
  const unis = data?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <header className="border-b border-ink-300 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">University hub</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Verify, certify, and grow your student talent</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {isStaff ? "Review verification requests, certify skills, and track institution outcomes." : "NexusWork partners with universities to verify identity and certify skills."}
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Tabs defaultValue="verifications">
          <TabsList>
            <TabsTrigger value="verifications"><ShieldCheck className="h-4 w-4" /> Verifications</TabsTrigger>
            <TabsTrigger value="skills"><BadgeCheck className="h-4 w-4" /> Skill certification</TabsTrigger>
          </TabsList>
          <TabsContent value="verifications">
            {isStaff ? <VerificationQueue token={token} /> : <p className="text-sm text-slate-300">Sign in as university staff to manage verifications.</p>}
          </TabsContent>
          <TabsContent value="skills">
            <Card className="p-6">
              <p className="text-sm text-slate-300">Certify a student's skill by inviting them to submit evidence, then approve here.</p>
              <Button className="mt-4" variant="secondary">Certify a skill</Button>
            </Card>
          </TabsContent>
        </Tabs>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Institution</CardTitle></CardHeader>
            <CardContent>
              {unis.length === 0 ? <p className="text-sm text-slate-300">No universities registered yet.</p> : (
                <ul className="space-y-2">{unis.map((u) => <li key={u._id} className="flex items-center gap-2 text-sm text-slate-300"><GraduationCap className="h-4 w-4 text-brass" /> {u.name}</li>)}</ul>
              )}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">23</p><p className="text-xs text-slate-300">Verified</p></div>
                <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">4</p><p className="text-xs text-slate-300">Certified</p></div>
                <div className="rounded-control bg-ink-700 p-3 text-center"><p className="font-mono text-lg text-brass">98%</p><p className="text-xs text-slate-300">On-time</p></div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

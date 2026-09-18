import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Plus, Send, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { getProjectOversight, createOversightTask, updateOversightTask, createProjectCheckIn } from "../../services/api/oversight.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Alert, Badge, Button, Card, CardHeader, Input, Select, Stat, StatGrid, Textarea } from "../../components/ui/index.js";
import { ROLES } from "../../constants/roles.constants.js";

function dateLabel(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProjectOversightPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [taskForm, setTaskForm] = useState({ milestone_id: "", title: "", description: "", due_date: "" });
  const [checkInForm, setCheckInForm] = useState({ milestone_id: "", progress: 0, summary: "", blockers: "" });
  const isStudent = user?.role === ROLES.STUDENT;
  const oversightQuery = useQuery({ queryKey: ["project-oversight", id], queryFn: () => getProjectOversight(id, token), enabled: Boolean(token && id) });
  const data = oversightQuery.data?.data;
  const milestones = data?.milestones || [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["project-oversight", id] });
  const taskMutation = useMutation({ mutationFn: () => createOversightTask(id, { ...taskForm, due_date: taskForm.due_date || null }, token), onSuccess: () => { setTaskForm({ milestone_id: "", title: "", description: "", due_date: "" }); refresh(); toast.success(t("oversight.taskAdded")); }, onError: (error) => toast.error(error.message || t("oversight.actionFailed")) });
  const statusMutation = useMutation({ mutationFn: ({ taskId, status }) => updateOversightTask(taskId, { status }, token), onSuccess: () => { refresh(); toast.success(t("oversight.taskUpdated")); }, onError: (error) => toast.error(error.message || t("oversight.actionFailed")) });
  const checkInMutation = useMutation({ mutationFn: () => createProjectCheckIn(id, { ...checkInForm, progress: Number(checkInForm.progress) }, token), onSuccess: () => { setCheckInForm({ milestone_id: "", progress: 0, summary: "", blockers: "" }); refresh(); toast.success(t("oversight.checkInPosted")); }, onError: (error) => toast.error(error.message || t("oversight.actionFailed")) });

  const latestCheckIns = useMemo(() => (data?.check_ins || []).slice(0, 5), [data?.check_ins]);

  if (oversightQuery.isLoading) return <div className="p-8 text-sm text-content-secondary">{t("oversight.loading")}</div>;
  if (oversightQuery.error) return <Alert variant="danger" title={t("oversight.loadFailed")}>{oversightQuery.error.message}</Alert>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">{t("oversight.eyebrow")}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="font-display text-3xl font-black text-content-primary">{data.project.title}</h1><p className="mt-1 text-sm text-content-secondary">{t("oversight.subtitle")}</p></div>
          <Badge>{data.contract.status}</Badge>
        </div>
      </div>

      <StatGrid className="lg:grid-cols-5">
        <Stat label={t("oversight.milestones")} value={data.analytics.total_milestones} icon={ClipboardList} />
        <Stat label={t("oversight.completed")} value={data.analytics.completed_milestones} icon={CheckCircle2} />
        <Stat label={t("oversight.onTime")} value={data.analytics.on_time_milestones} icon={ShieldCheck} />
        <Stat label={t("oversight.atRisk")} value={data.analytics.at_risk_milestones} icon={AlertTriangle} />
        <Stat label={t("oversight.averageDelay")} value={`${Number(data.analytics.average_delay_days || 0).toFixed(1)}d`} icon={Activity} />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader title={t("oversight.boardTitle")} description={t("oversight.boardDescription")} />
          <div className="space-y-4 p-5 pt-0">
            {milestones.length === 0 && <p className="text-sm text-content-secondary">{t("oversight.noMilestones")}</p>}
            {milestones.map((milestone) => (
              <div key={milestone._id} className="rounded-card border border-border-subtle bg-surface-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-semibold text-content-primary">{milestone.title}</p><p className="mt-1 text-xs text-content-secondary">{t("oversight.due")}: {dateLabel(milestone.due_date)}</p></div>
                  <div className="flex items-center gap-2"><Badge>{milestone.status}</Badge>{milestone.risk?.status === "at_risk" && <Badge tone="danger">{t("oversight.risk")}</Badge>}</div>
                </div>
                {milestone.risk?.status === "at_risk" && <p className="mt-3 text-xs text-amber-200">{milestone.risk.factors.map((factor) => factor.code).join(" · ")}</p>}
                <div className="mt-4 space-y-2">
                  {(milestone.tasks || []).map((task) => <div key={task._id} className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border-subtle p-3"><span className="text-sm text-content-primary">{task.title}</span>{isStudent ? <Select aria-label={task.title} value={task.status} onChange={(event) => statusMutation.mutate({ taskId: task._id, status: event.target.value })} options={[{ value: "todo", label: t("oversight.status.todo") }, { value: "in_progress", label: t("oversight.status.inProgress") }, { value: "completed", label: t("oversight.status.completed") }, { value: "blocked", label: t("oversight.status.blocked") }]} /> : <Badge>{t(`oversight.status.${task.status === "in_progress" ? "inProgress" : task.status}`)}</Badge>}</div>)}
                  {(milestone.tasks || []).length === 0 && <p className="text-xs text-slate-400">{t("oversight.noTasks")}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {!isStudent && <Card><CardHeader title={t("oversight.addTask")} description={t("oversight.addTaskDescription")} /><div className="space-y-3 p-5 pt-0"><Select aria-label={t("oversight.milestone")} value={taskForm.milestone_id} onChange={(event) => setTaskForm({ ...taskForm, milestone_id: event.target.value })} options={[{ value: "", label: t("oversight.chooseMilestone") }, ...milestones.map((item) => ({ value: item._id, label: item.title }))]} /><Input aria-label={t("oversight.taskTitle")} placeholder={t("oversight.taskTitle")} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /><Input type="date" aria-label={t("oversight.dueDate")} value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} /><Button disabled={!taskForm.milestone_id || !taskForm.title.trim()} loading={taskMutation.isPending} onClick={() => taskMutation.mutate()}><Plus className="h-4 w-4" />{t("oversight.addTask")}</Button></div></Card>}
          {isStudent && <Card><CardHeader title={t("oversight.checkInTitle")} description={t("oversight.checkInDescription")} /><div className="space-y-3 p-5 pt-0"><Select aria-label={t("oversight.milestone")} value={checkInForm.milestone_id} onChange={(event) => setCheckInForm({ ...checkInForm, milestone_id: event.target.value })} options={[{ value: "", label: t("oversight.chooseMilestone") }, ...milestones.map((item) => ({ value: item._id, label: item.title }))]} /><Input type="number" min="0" max="100" aria-label={t("oversight.progress")} placeholder={t("oversight.progress")} value={checkInForm.progress} onChange={(event) => setCheckInForm({ ...checkInForm, progress: event.target.value })} /><Textarea aria-label={t("oversight.summary")} placeholder={t("oversight.summary")} value={checkInForm.summary} onChange={(event) => setCheckInForm({ ...checkInForm, summary: event.target.value })} /><Textarea aria-label={t("oversight.blockers")} placeholder={t("oversight.blockers")} value={checkInForm.blockers} onChange={(event) => setCheckInForm({ ...checkInForm, blockers: event.target.value })} /><Button disabled={!checkInForm.milestone_id || !checkInForm.summary.trim()} loading={checkInMutation.isPending} onClick={() => checkInMutation.mutate()}><Send className="h-4 w-4" />{t("oversight.postCheckIn")}</Button></div></Card>}
          <Card><CardHeader title={t("oversight.recentCheckIns")} description={t("oversight.recentCheckInsDescription")} /><div className="space-y-3 p-5 pt-0">{latestCheckIns.length === 0 ? <p className="text-sm text-slate-300">{t("oversight.noCheckIns")}</p> : latestCheckIns.map((checkIn) => <div key={checkIn._id} className="rounded-control border border-ink-300 p-3"><div className="flex justify-between gap-3 text-xs text-slate-300"><span>{checkIn.author_id?.name || t("oversight.student")}</span><span>{dateLabel(checkIn.createdAt)}</span></div><p className="mt-2 text-sm font-semibold text-slate">{checkIn.progress}% · {checkIn.summary}</p>{checkIn.blockers && <p className="mt-1 text-xs text-amber-200">{checkIn.blockers}</p>}</div>)}</div></Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { getRecommendationGovernance, updateRecommendationGovernance, listRecommendationEvaluations, createRecommendationEvaluation } from "../../services/api/admin.api.js";
import { useTranslation } from "react-i18next";

export default function RecommendationGovernancePanel({ token }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const governance = useQuery({ queryKey: ["admin-recommendation-governance"], queryFn: () => getRecommendationGovernance(token) });
  const evaluations = useQuery({ queryKey: ["admin-recommendation-evaluations"], queryFn: () => listRecommendationEvaluations(token) });
  const thresholds = governance.data?.data?.settings?.risk_thresholds || {};
  const [form, setForm] = useState({ deadline_warning_hours: "", stale_check_in_days: "", max_overdue_tasks: "" });
  const [evaluation, setEvaluation] = useState({ provider: "groq", name: "", version: "", evaluated_at: "", review_due_at: "", methodology: "", sample_size: "" });
  const save = useMutation({
    mutationFn: () => updateRecommendationGovernance({ risk_thresholds: Object.fromEntries(Object.entries({ ...thresholds, ...form }).map(([key, value]) => [key, Number(value)])) }, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-recommendation-governance"] }); toast.success(t("admin.governanceSaved", { defaultValue: "Governance settings saved" })); },
    onError: (error) => toast.error(error.message || t("admin.governanceSaveError", { defaultValue: "Could not save governance settings" })),
  });
  const create = useMutation({
    mutationFn: () => createRecommendationEvaluation({ ...evaluation, sample_size: Number(evaluation.sample_size || 0), evaluated_at: new Date(evaluation.evaluated_at).toISOString(), review_due_at: new Date(evaluation.review_due_at).toISOString() }, token),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-recommendation-evaluations"] }); queryClient.invalidateQueries({ queryKey: ["admin-recommendation-governance"] }); setEvaluation({ provider: "groq", name: "", version: "", evaluated_at: "", review_due_at: "", methodology: "", sample_size: "" }); toast.success(t("admin.evaluationSaved", { defaultValue: "Model evaluation recorded" })); },
    onError: (error) => toast.error(error.message || t("admin.evaluationSaveError", { defaultValue: "Could not record evaluation" })),
  });
  const setThreshold = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="mt-6 grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader><CardTitle>{t("admin.recommendationGovernance", { defaultValue: "Recommendation governance" })}</CardTitle><CardDescription>{t("admin.recommendationGovernanceHint", { defaultValue: "Configure oversight thresholds without changing code. Recommendations remain advisory." })}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {["deadline_warning_hours", "stale_check_in_days", "max_overdue_tasks"].map((key) => <div key={key}><Label htmlFor={`governance-${key}`}>{key.replaceAll("_", " ")}</Label><Input id={`governance-${key}`} type="number" min="0" value={form[key] === "" ? thresholds[key] ?? "" : form[key]} onChange={(event) => setThreshold(key, event.target.value)} /></div>)}
        <div className="flex items-center justify-between rounded-xl border border-ink-300 p-3 text-sm"><span>{t("admin.modelStatus", { defaultValue: "Enabled model evaluation" })}</span><Badge variant={governance.data?.data?.enabled_model?.evaluated ? "success" : "danger"}>{governance.data?.data?.enabled_model?.evaluated ? t("admin.evaluated", { defaultValue: "Evaluated" }) : t("admin.reviewRequired", { defaultValue: "Review required" })}</Badge></div>
        <Button loading={save.isPending} onClick={() => save.mutate()}>{t("common.save", { defaultValue: "Save changes" })}</Button>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>{t("admin.modelEvaluations", { defaultValue: "Model evaluations" })}</CardTitle><CardDescription>{t("admin.modelEvaluationsHint", { defaultValue: "Keep a dated evaluation and bias-review record for every enabled model." })}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[["provider", "Provider"], ["name", "Model name"], ["version", "Version"], ["sample_size", "Sample size"], ["evaluated_at", "Evaluated at"], ["review_due_at", "Review due"]].map(([key, label]) => <div key={key}><Label htmlFor={`evaluation-${key}`}>{label}</Label><Input id={`evaluation-${key}`} type={key.includes("_at") ? "date" : key === "sample_size" ? "number" : "text"} value={evaluation[key]} onChange={(event) => setEvaluation((current) => ({ ...current, [key]: event.target.value }))} /></div>)}
        </div>
        <div><Label htmlFor="evaluation-methodology">{t("admin.methodology", { defaultValue: "Methodology" })}</Label><Input id="evaluation-methodology" value={evaluation.methodology} onChange={(event) => setEvaluation((current) => ({ ...current, methodology: event.target.value }))} /></div>
        <Button loading={create.isPending} disabled={!evaluation.name || !evaluation.version || !evaluation.evaluated_at || !evaluation.review_due_at || !evaluation.methodology} onClick={() => create.mutate()}>{t("admin.recordEvaluation", { defaultValue: "Record evaluation" })}</Button>
        <div className="space-y-2 border-t border-ink-300 pt-3">{(evaluations.data?.data || []).map((item) => <div key={item._id} className="flex items-center justify-between rounded-lg bg-ink-50 p-3 text-xs"><span>{item.provider} / {item.name} / {item.version}<br /><span className="text-slate-300">Reviewed {new Date(item.evaluated_at).toLocaleDateString()}</span></span><Badge variant={item.status === "approved" ? "success" : "secondary"}>{item.status}</Badge></div>)}</div>
      </CardContent>
    </Card>
  </div>;
}

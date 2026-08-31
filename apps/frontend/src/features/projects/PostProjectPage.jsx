import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { createProject } from "../../services/api/projects.api.js";
import { listSkills } from "../../services/api/skills.api.js";
import { getSuggestedPrice } from "../../services/api/recommendation.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { formatCurrency } from "../../utils/currency.utils.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Label } from "../../components/ui/shadcn/label.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/shadcn/select.jsx";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/shadcn/form.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";

const CATEGORIES = ["Development", "Design", "Data & Research", "Writing", "Video & Motion", "Marketing"];
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const projectSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(120),
  description: z.string().min(40, "Describe the work in more detail (min 40 characters)").max(5000),
  category: z.string().min(1, "Choose a category"),
  experience_level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  budget_type: z.enum(["fixed", "range"]),
  budget: z.coerce.number().min(10, "Budget must be at least $10").max(1000000, "Budget looks too high").optional(),
  budget_min: z.coerce.number().min(10, "Minimum budget must be at least $10").max(1000000).optional(),
  budget_max: z.coerce.number().min(10, "Maximum budget must be at least $10").max(1000000).optional(),
  currency: z.enum(["USD", "ETB"]),
  deadline: z.string().min(1, "Pick a deadline"),
}).superRefine((value, context) => {
  if (value.budget_type === "fixed" && value.budget === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget"], message: "Enter a budget" });
  }
  if (value.budget_type === "range") {
    if (value.budget_min === undefined || value.budget_max === undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_min"], message: "Enter both budget values" });
    } else if (value.budget_min > value.budget_max) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_max"], message: "Maximum must be at least minimum" });
    }
  }
});

function SkillPicker({ value, onChange, catalog = [] }) {
  const [input, setInput] = useState("");
  const skills = value || [];

  function addSkill() {
    const selected = catalog.find((skill) => skill._id === input);
    if (!selected || skills.some((skill) => skill._id === selected._id)) { setInput(""); return; }
    onChange([...skills, selected]);
    setInput("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <select value={input} onChange={(e) => setInput(e.target.value)} aria-label="Choose required skill"
          className="h-11 min-w-0 flex-1 rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate">
          <option value="">Choose a skill from the catalogue</option>
          {catalog.filter((skill) => !skills.some((selected) => selected._id === skill._id)).map((skill) => (
            <option key={skill._id} value={skill._id}>{skill.name}</option>
          ))}
        </select>
        <Button type="button" variant="secondary" className="h-11 shrink-0" onClick={addSkill}>Add</Button>
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge key={s._id} variant="secondary" className="gap-1 pr-1">
              {s.name}
              <button type="button" onClick={() => onChange(skills.filter((x) => x._id !== s._id))}
                className="ml-1 rounded-full p-0.5 hover:bg-brick/20 hover:text-brick"
                aria-label={`Remove ${s.name}`}>×</button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceSuggestion({ skills, category, token, onApply }) {
  const enabled = skills.length > 0 || Boolean(category);
  const { data, isFetching } = useQuery({
    queryKey: ["price-suggestion", skills, category],
    queryFn: () => getSuggestedPrice({ skills, category }, token),
    enabled,
    staleTime: 30_000,
  });

  if (!enabled) return null;

  const suggestion = data?.data;
  if (!isFetching && suggestion?.suggested_price == null) {
    return (
      <p className="mt-2 text-xs text-slate-300">
        Not enough historical proposals for these skills yet to suggest a price.
      </p>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-brass" />
      {isFetching ? (
        <span className="text-slate-300">Checking similar accepted proposals…</span>
      ) : (
        <span className="text-slate-300">
          Similar accepted proposals settled around{" "}
          <span className="font-mono font-semibold text-brass">{formatCurrency(suggestion.suggested_price)}</span>
          {" "}({suggestion.sample_size} sample{suggestion.sample_size === 1 ? "" : "s"}).{" "}
          <button type="button" onClick={() => onApply(suggestion.suggested_price)} className="font-semibold text-brass hover:underline">
            Use this
          </button>
        </span>
      )}
    </div>
  );
}

export default function PostProjectPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState([]);
  const { data: skillsResponse } = useQuery({ queryKey: ["skills", "project-picker"], queryFn: () => listSkills() });
  const skillCatalog = skillsResponse?.data || [];

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", description: "", category: "", experience_level: "intermediate", budget_type: "fixed", budget: "", budget_min: "", budget_max: "", currency: "USD", deadline: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload) => createProject(payload, token),
    onSuccess: () => { toast.success("Project posted — students can now submit proposals"); navigate("/projects"); },
    onError: (err) => toast.error(err.message || "Could not post project"),
  });

  async function handleSubmit(values) {
    mutation.mutate({
      ...values,
      required_skills: skills.map((skill) => skill.name),
      required_skill_ids: skills.map((skill) => skill._id),
      budget: Number(values.budget_type === "range" ? values.budget_max : values.budget),
      budget_min: values.budget_type === "range" ? Number(values.budget_min) : undefined,
      budget_max: values.budget_type === "range" ? Number(values.budget_max) : undefined,
    });
  }

  return (
    <div className="w-full animate-fade-up">
      <header className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-brass" />
        <div>
          <h1 className="font-display text-2xl tracking-tight text-slate">Post a project</h1>
          <p className="text-sm text-slate-300">Get university-verified students bidding on your brief.</p>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-2" aria-label="Progress">
        {["Basics", "Skills & budget", "Review"].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1 rounded-full ${i <= step ? "bg-brass" : "bg-ink-300"}`} />
            <p className={`text-xs ${i === step ? "font-semibold text-brass" : "text-slate-300"}`}>{label}</p>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{step === 0 ? "Tell us about the work" : step === 1 ? "Skills, budget & timeline" : "Review & publish"}</CardTitle>
              <CardDescription>
                {step === 0 ? "A clear title and description get better proposals."
                  : step === 1 ? "Set expectations so students can price accurately."
                  : "Check everything looks right before publishing."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {step === 0 && (
                <>
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Project title</FormLabel>
                      <FormControl><Input placeholder="E.g. Build a React dashboard for our campus club" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={6} placeholder="What do you need built? What does success look like?" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger></FormControl>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <Label>Required skills</Label>
                    <p className="mb-2 text-xs text-slate-300">Structured skills drive our matching engine.</p>
                    <SkillPicker value={skills} catalog={skillCatalog} onChange={setSkills} />
                  </div>
                  <FormField control={form.control} name="experience_level" render={({ field }) => (
                    <FormItem><FormLabel>Experience level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{EXPERIENCE_LEVELS.map((lvl) => <SelectItem key={lvl} value={lvl} className="capitalize">{lvl}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>Payment currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD — Stripe</SelectItem>
                          <SelectItem value="ETB">ETB — Chapa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>This currency is locked into the contract and its milestones.</FormDescription>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="budget_type" render={({ field }) => (
                    <FormItem><FormLabel>Budget type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="fixed">Fixed budget</SelectItem><SelectItem value="range">Budget range</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  {form.watch("budget_type") === "range" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField control={form.control} name="budget_min" render={({ field }) => (
                        <FormItem><FormLabel>Minimum ({form.watch("currency")})</FormLabel><FormControl><Input type="number" min={10} placeholder="500" className="font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="budget_max" render={({ field }) => (
                        <FormItem><FormLabel>Maximum ({form.watch("currency")})</FormLabel><FormControl><Input type="number" min={10} placeholder="1000" className="font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  ) : (
                    <FormField control={form.control} name="budget" render={({ field }) => (
                      <FormItem><FormLabel>Budget ({form.watch("currency")})</FormLabel>
                        <FormControl><Input type="number" min={10} placeholder="750" className="font-mono" {...field} /></FormControl>
                        <PriceSuggestion skills={skills.map((skill) => skill.name)} category={form.watch("category")} token={token} onApply={(price) => form.setValue("budget", price, { shouldValidate: true })} />
                        <FormMessage /></FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem><FormLabel>Deadline</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">Title</dt><dd className="font-semibold text-slate">{form.watch("title")}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">Category</dt><dd className="font-semibold text-slate">{form.watch("category")}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">Budget</dt><dd className="font-mono text-brass">{form.watch("currency")} {form.watch("budget")}</dd></div>
                    {skills.length > 0 && <div className="flex flex-wrap gap-1.5 pt-2">{skills.map((s) => <Badge key={s._id} variant="secondary">{s.name}</Badge>)}</div>}
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={async () => {
                const valid = await form.trigger(step === 0 ? ["title", "description", "category"] : ["experience_level", "budget", "currency", "deadline"]);
                if (valid) setStep((s) => Math.min(2, s + 1));
              }}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" loading={mutation.isPending}>Publish project</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

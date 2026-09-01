import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const CATEGORIES = [
  { slug: "web-development", name: "Web Development" },
  { slug: "mobile-development", name: "Mobile Development" },
  { slug: "data-science-ml", name: "Data Science & ML" },
  { slug: "ui-ux-design", name: "UI/UX Design" },
  { slug: "graphic-design", name: "Graphic Design" },
  { slug: "writing-content", name: "Writing & Content" },
  { slug: "marketing-seo", name: "Marketing & SEO" },
  { slug: "research-analysis", name: "Research & Analysis" },
  { slug: "engineering-cad", name: "Engineering & CAD" },
  { slug: "video-animation", name: "Video & Animation" },
  { slug: "translation-languages", name: "Translation & Languages" },
  { slug: "other", name: "Other" },
];
const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const parseOptionalNumber = (val) => (val === "" || val === null || val === undefined ? undefined : Number(val));

const projectSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(120),
  description: z.string().min(40, "Describe the work in more detail (min 40 characters)").max(5000),
  category: z.string().min(1, "Choose a category"),
  experience_level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  budget_type: z.enum(["fixed", "range"]),
  budget: z.preprocess(
    parseOptionalNumber,
    z.number({ invalid_type_error: "Budget must be a number" })
      .min(10, "Budget must be at least $10")
      .max(1000000, "Budget looks too high")
      .optional()
  ),
  budget_min: z.preprocess(
    parseOptionalNumber,
    z.number({ invalid_type_error: "Minimum budget must be a number" })
      .min(10, "Minimum budget must be at least $10")
      .max(1000000)
      .optional()
  ),
  budget_max: z.preprocess(
    parseOptionalNumber,
    z.number({ invalid_type_error: "Maximum budget must be a number" })
      .min(10, "Maximum budget must be at least $10")
      .max(1000000)
      .optional()
  ),
  currency: z.enum(["USD", "ETB"]),
  deadline: z.string().min(1, "Pick a deadline"),
}).superRefine((value, context) => {
  if (value.budget_type === "fixed" && (value.budget === undefined || isNaN(value.budget))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget"], message: "Enter a budget" });
  }
  if (value.budget_type === "range") {
    if (value.budget_min === undefined || isNaN(value.budget_min) || value.budget_max === undefined || isNaN(value.budget_max)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_min"], message: "Enter both budget values" });
    } else if (value.budget_min > value.budget_max) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_max"], message: "Maximum must be at least minimum" });
    }
  }
});

function SkillPicker({ value, onChange, catalog = [], t }) {
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
        <select value={input} onChange={(e) => setInput(e.target.value)} aria-label={t("projectsForm.chooseSkill")}
          className="h-11 min-w-0 flex-1 rounded-control border border-ink-300 bg-ink-100 px-3 text-sm text-slate">
          <option value="">{t("projectsForm.chooseSkill")}</option>
          {catalog.filter((skill) => !skills.some((selected) => selected._id === skill._id)).map((skill) => (
            <option key={skill._id} value={skill._id}>{skill.name}</option>
          ))}
        </select>
        <Button type="button" variant="secondary" className="h-11 shrink-0" onClick={addSkill}>{t("projectsForm.add")}</Button>
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
  const { t } = useTranslation();
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
        {t("projectsForm.priceUnavailable")}
      </p>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-brass" />
      {isFetching ? (
        <span className="text-slate-300">{t("projectsForm.checkingPrice")}</span>
      ) : (
        <span className="text-slate-300">
          {t("projectsForm.similarPrice")} {" "}
          <span className="font-mono font-semibold text-brass">{formatCurrency(suggestion.suggested_price)}</span>
          {" "}({suggestion.sample_size} {t("projectsForm.sample")}{suggestion.sample_size === 1 ? "" : "s"}).{" "}
          <button type="button" onClick={() => onApply(suggestion.suggested_price)} className="font-semibold text-brass hover:underline">
            {t("projectsForm.usePrice")}
          </button>
        </span>
      )}
    </div>
  );
}

export default function PostProjectPage() {
  const { t } = useTranslation();
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
    onSuccess: () => { toast.success(t("projectsForm.projectPosted")); navigate("/projects"); },
    onError: (err) => toast.error(err.message || t("projectsForm.postError")),
  });

  function handleInvalid(errors) {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const firstError = errors[firstField]?.message || "Please check your project details.";
      toast.error(firstError);
    }
  }

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
          <h1 className="font-display text-2xl tracking-tight text-slate">{t("projectsForm.postTitle")}</h1>
          <p className="text-sm text-slate-300">{t("projectsForm.postDescription")}</p>
        </div>
      </header>

      <div className="mt-6 flex items-center gap-2" aria-label={t("common.progress", { defaultValue: "Progress" })}>
        {[t("projectsForm.basics"), t("projectsForm.skillsBudget"), t("projectsForm.review")].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1 rounded-full ${i <= step ? "bg-brass" : "bg-ink-300"}`} />
            <p className={`text-xs ${i === step ? "font-semibold text-brass" : "text-slate-300"}`}>{label}</p>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{step === 0 ? t("projectsForm.tellWork") : step === 1 ? t("projectsForm.setExpectations") : t("projectsForm.reviewPublish")}</CardTitle>
              <CardDescription>
                {step === 0 ? t("projectsForm.tellWorkHint") : step === 1 ? t("projectsForm.setExpectationsHint") : t("projectsForm.reviewPublishHint")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {step === 0 && (
                <>
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.title")}</FormLabel>
                      <FormControl><Input placeholder={t("projectsForm.titlePlaceholder")} {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.description")}</FormLabel>
                      <FormControl><Textarea rows={6} placeholder={t("projectsForm.descriptionPlaceholder")} {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.category")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t("projectsForm.chooseCategory")} /></SelectTrigger></FormControl>
                        <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category.slug} value={category.slug}>{category.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <Label>{t("projectsForm.requiredSkills")}</Label>
                    <p className="mb-2 text-xs text-slate-300">{t("projectsForm.skillsHint")}</p>
                    <SkillPicker value={skills} catalog={skillCatalog} onChange={setSkills} t={t} />
                  </div>
                  <FormField control={form.control} name="experience_level" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.experience")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{EXPERIENCE_LEVELS.map((lvl) => <SelectItem key={lvl} value={lvl} className="capitalize">{lvl}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.currency")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="USD">{t("projectsForm.stripe")}</SelectItem>
                          <SelectItem value="ETB">{t("projectsForm.chapa")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>{t("projectsForm.currencyHint")}</FormDescription>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="budget_type" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.budgetType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="fixed">{t("projectsForm.fixed")}</SelectItem><SelectItem value="range">{t("projectsForm.range")}</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  {form.watch("budget_type") === "range" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField control={form.control} name="budget_min" render={({ field }) => (
                        <FormItem><FormLabel>{t("projectsForm.minimum", { currency: form.watch("currency") })}</FormLabel><FormControl><Input type="number" min={10} placeholder="500" className="font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="budget_max" render={({ field }) => (
                        <FormItem><FormLabel>{t("projectsForm.maximum", { currency: form.watch("currency") })}</FormLabel><FormControl><Input type="number" min={10} placeholder="1000" className="font-mono" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  ) : (
                    <FormField control={form.control} name="budget" render={({ field }) => (
                      <FormItem><FormLabel>{t("projectsForm.budget", { currency: form.watch("currency") })}</FormLabel>
                        <FormControl><Input type="number" min={10} placeholder="750" className="font-mono" {...field} /></FormControl>
                        <PriceSuggestion skills={skills.map((skill) => skill.name)} category={form.watch("category")} token={token} onApply={(price) => form.setValue("budget", price, { shouldValidate: true })} />
                        <FormMessage /></FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem><FormLabel>{t("projectsForm.deadline")}</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">{t("projectsForm.titleSummary")}</dt><dd className="font-semibold text-slate">{form.watch("title")}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">{t("projectsForm.categorySummary")}</dt><dd className="font-semibold text-slate">{form.watch("category")}</dd></div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-300">{t("projectsForm.budgetSummary")}</dt>
                      <dd className="font-mono text-brass">
                        {form.watch("currency")} {form.watch("budget_type") === "range" ? `${form.watch("budget_min")} - ${form.watch("budget_max")}` : form.watch("budget")}
                      </dd>
                    </div>
                    {skills.length > 0 && <div className="flex flex-wrap gap-1.5 pt-2">{skills.map((s) => <Badge key={s._id} variant="secondary">{s.name}</Badge>)}</div>}
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> {t("projectsForm.back")}
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={async () => {
                const fieldsToValidate = step === 0
                  ? ["title", "description", "category"]
                  : form.watch("budget_type") === "range"
                  ? ["experience_level", "budget_type", "budget_min", "budget_max", "currency", "deadline"]
                  : ["experience_level", "budget_type", "budget", "currency", "deadline"];
                const valid = await form.trigger(fieldsToValidate);
                if (valid) setStep((s) => Math.min(2, s + 1));
              }}>
                {t("projectsForm.continue")} <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" loading={mutation.isPending}>{t("projectsForm.publish")}</Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { createProject } from "../../services/api/projects.api.js";
import { useAuth } from "../../hooks/useAuth.js";
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
  budget: z.coerce.number().min(10, "Budget must be at least $10").max(1000000, "Budget looks too high"),
  deadline: z.string().min(1, "Pick a deadline"),
});

function SkillPicker({ value, onChange }) {
  const [input, setInput] = useState("");
  const skills = value || [];

  function addSkill() {
    const t = input.trim();
    if (!t || skills.includes(t)) { setInput(""); return; }
    onChange([...skills, t]);
    setInput("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
          placeholder="Type a skill and press Enter" aria-label="Add required skill" />
        <Button type="button" variant="secondary" className="h-11 shrink-0" onClick={addSkill}>Add</Button>
      </div>
      {skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 pr-1">
              {s}
              <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))}
                className="ml-1 rounded-full p-0.5 hover:bg-brick/20 hover:text-brick"
                aria-label={`Remove ${s}`}>×</button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostProjectPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState([]);

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", description: "", category: "", experience_level: "intermediate", budget: "", deadline: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload) => createProject(payload, token),
    onSuccess: () => { toast.success("Project posted — students can now submit proposals"); navigate("/projects"); },
    onError: (err) => toast.error(err.message || "Could not post project"),
  });

  async function handleSubmit(values) {
    mutation.mutate({ ...values, required_skills: skills, budget: Number(values.budget) });
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
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
                    <SkillPicker value={skills} onChange={setSkills} />
                  </div>
                  <FormField control={form.control} name="experience_level" render={({ field }) => (
                    <FormItem><FormLabel>Experience level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{EXPERIENCE_LEVELS.map((lvl) => <SelectItem key={lvl} value={lvl} className="capitalize">{lvl}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="budget" render={({ field }) => (
                    <FormItem><FormLabel>Budget (USD)</FormLabel>
                      <FormControl><Input type="number" min={10} placeholder="750" className="font-mono" {...field} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
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
                    <div className="flex justify-between gap-4"><dt className="text-slate-300">Budget</dt><dd className="font-mono text-brass">${form.watch("budget")}</dd></div>
                    {skills.length > 0 && <div className="flex flex-wrap gap-1.5 pt-2">{skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>}
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
                const valid = await form.trigger(step === 0 ? ["title", "description", "category"] : ["experience_level", "budget", "deadline"]);
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

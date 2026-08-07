import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2, Sparkles, Loader2, X,
  FileText, Code2, DollarSign, Calendar, Paperclip, Eye, Rocket, AlertCircle,
  Plus, Upload, Link as LinkIcon, TrendingUp, Info,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { CATEGORIES, SKILLS } from "../data/projects";

const DRAFT_KEY = "nexus_project_draft";
const STEPS = [
  { id: "basics", label: "Basics", icon: FileText },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "budget", label: "Budget", icon: DollarSign },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "attachments", label: "Attachments", icon: Paperclip },
  { id: "review", label: "AI Review", icon: Sparkles },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "publish", label: "Publish", icon: Rocket },
];

const EXPERIENCE_LEVELS = ["Entry", "Intermediate", "Expert"];
const BUDGET_TYPES = [
  { id: "fixed", label: "Fixed Price", hint: "Best for well-defined projects" },
  { id: "hourly", label: "Hourly Rate", hint: "Best for ongoing work" },
];

const AI_SUGGESTIONS = {
  title: ["Add a clear technology keyword (e.g., React, Node.js)", "Mention the deliverable (e.g., 'Web App', 'Dashboard')"],
  description: ["Include project scope and non-goals", "Describe expected technical stack"],
  skills: ["Consider adding TypeScript for type safety", "Add Recharts for data visualization work"],
};

const defaultDraft = {
  title: "",
  category: "",
  summary: "",
  description: "",
  skills: [],
  experienceLevel: "Intermediate",
  budgetType: "fixed",
  budgetMin: "",
  budgetMax: "",
  duration: "",
  startDate: "",
  priority: "normal",
  attachments: [],
};

export default function PostProjectPage() {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : defaultDraft;
    } catch {
      return defaultDraft;
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Autosave every change
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(data)), 500);
    return () => clearTimeout(t);
  }, [data]);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const validateStep = (stepIdx) => {
    const errs = {};
    if (stepIdx === 0) {
      if (!data.title.trim()) errs.title = "Project title is required";
      else if (data.title.length < 10) errs.title = "Title should be at least 10 characters";
      if (!data.category) errs.category = "Select a category";
      if (!data.description.trim()) errs.description = "Description is required";
    }
    if (stepIdx === 1) {
      if (data.skills.length === 0) errs.skills = "Select at least one skill";
    }
    if (stepIdx === 2) {
      if (!data.budgetMin) errs.budgetMin = "Enter a minimum budget";
    }
    if (stepIdx === 3) {
      if (!data.duration) errs.duration = "Select estimated duration";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    } else {
      notify("Please fix the errors before continuing.", "error");
    }
  };

  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const saveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    notify("Draft saved successfully", "success");
  };

  const publish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 2000));
    localStorage.removeItem(DRAFT_KEY);
    setPublishing(false);
    notify("Project published! Freelancers can now view it.", "success");
    setTimeout(() => navigate("/projects"), 1500);
  };

  const stepProps = { data, update, errors };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <button onClick={saveDraft} disabled={saving} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Post a New Project</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Create a project to find verified student talent.</p>
      </div>

      {/* Step Indicator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isComplete = idx < currentStep;
            return (
              <button
                key={step.id}
                onClick={() => idx < currentStep && setCurrentStep(idx)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isComplete
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-zinc-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && <StepBasics {...stepProps} />}
            {currentStep === 1 && <StepSkills {...stepProps} />}
            {currentStep === 2 && <StepBudget {...stepProps} />}
            {currentStep === 3 && <StepTimeline {...stepProps} />}
            {currentStep === 4 && <StepAttachments {...stepProps} dragActive={dragActive} setDragActive={setDragActive} />}
            {currentStep === 5 && <StepReview {...stepProps} />}
            {currentStep === 6 && <StepPreview {...stepProps} />}
            {currentStep === 7 && <StepPublish {...stepProps} publishing={publishing} publish={publish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex items-center justify-between">
          <button onClick={back} disabled={currentStep === 0} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <button onClick={next} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============ STEP COMPONENTS ============

function Field({ label, error, required, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{hint}</p>}
      {error && <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {error}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";
const textAreaCls = "w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

function StepBasics({ data, update, errors }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Basics</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400">Start with a clear title and category so we can match the right talent.</p>

      <Field label="Project Title" error={errors.title} required>
        <input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g., React Dashboard for Student Analytics" className={inputCls} />
        {AI_SUGGESTIONS.title.map((s, i) => (
          <p key={i} className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" /> AI tip: {s}
          </p>
        ))}
      </Field>

      <Field label="Category" error={errors.category} required>
        <select value={data.category} onChange={(e) => update({ category: e.target.value })} className={inputCls}>
          <option value="">Select category</option>
          {CATEGORIES.filter((c) => c !== "All Projects").map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <Field label="Summary" hint="One-line overview shown on project cards (max 140 chars)">
        <input value={data.summary} onChange={(e) => update({ summary: e.target.value.slice(0, 140) })} placeholder="Short description..." maxLength={140} className={inputCls} />
      </Field>

      <Field label="Full Description" error={errors.description} required>
        <textarea rows="6" value={data.description} onChange={(e) => update({ description: e.target.value })} placeholder="Describe the project goals, technical requirements, and expected deliverables..." className={textAreaCls} />
        <p className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
          <Sparkles className="h-3 w-3" /> {AI_SUGGESTIONS.description[0]}
        </p>
      </Field>
    </div>
  );
}

function StepSkills({ data, update, errors }) {
  const [search, setSearch] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const availableSkills = SKILLS.filter(
    (s) => !data.skills.includes(s) && s.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (skill) => {
    update({ skills: data.skills.includes(skill) ? data.skills.filter((s) => s !== skill) : [...data.skills, skill] });
  };

  const addCustom = () => {
    if (customSkill.trim() && !data.skills.includes(customSkill)) {
      update({ skills: [...data.skills, customSkill.trim()] });
      setCustomSkill("");
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Skills & Requirements</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400">Select the skills students must have to work on this project.</p>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-300">
          Required Skills <span className="text-red-500">*</span>
        </label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills..." className={inputCls} />
        <div className="mt-3 flex flex-wrap gap-2">
          {data.skills.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
              {s}
              <button onClick={() => toggle(s)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableSkills.slice(0, 8).map((s) => (
            <button key={s} onClick={() => toggle(s)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              <Plus className="inline h-3 w-3" /> {s}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} placeholder="Add custom skill" className={inputCls} />
          <button onClick={addCustom} className="rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Add</button>
        </div>
        {errors.skills && <p className="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3 w-3" /> {errors.skills}</p>}
        {AI_SUGGESTIONS.skills.map((s, i) => (
          <p key={i} className="mt-1 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" /> AI: {s}
          </p>
        ))}
      </div>

      <Field label="Experience Level">
        <div className="flex gap-2">
          {EXPERIENCE_LEVELS.map((lvl) => (
            <button key={lvl} onClick={() => update({ experienceLevel: lvl })} className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${data.experienceLevel === lvl ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"}`}>
              {lvl}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepBudget({ data, update, errors }) {
  const budgetMin = parseFloat(data.budgetMin) || 0;
  const budgetMax = parseFloat(data.budgetMax) || budgetMin;
  const fee = budgetMin * 0.1;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Budget & Pricing</h2>

      <Field label="Budget Type">
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_TYPES.map((b) => (
            <button key={b.id} onClick={() => update({ budgetType: b.id })} className={`rounded-xl border p-4 text-left transition-colors ${data.budgetType === b.id ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200 dark:border-white/10"}`}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{b.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{b.hint}</p>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={data.budgetType === "fixed" ? "Minimum Budget (USD)" : "Min Hourly Rate"} error={errors.budgetMin} required>
          <input type="number" value={data.budgetMin} onChange={(e) => update({ budgetMin: e.target.value })} placeholder="500" className={inputCls} />
        </Field>
        <Field label={data.budgetType === "fixed" ? "Maximum Budget (USD)" : "Max Hourly Rate"}>
          <input type="number" value={data.budgetMax} onChange={(e) => update({ budgetMax: e.target.value })} placeholder="1000" className={inputCls} />
        </Field>
      </div>

      {budgetMin > 0 && (
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-500/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            <TrendingUp className="h-4 w-4" /> Market comparison
          </p>
          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
            Your ${budgetMin} budget is in the <b>top 35%</b> for similar {data.category || "projects"}. This will attract {Math.floor(budgetMin / 50)} to {Math.floor(budgetMin / 30)} quality proposals.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Project budget</span>
          <span className="font-bold text-slate-900 dark:text-white">${budgetMin.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-slate-500 dark:text-zinc-400">Platform fee (10%)</span>
          <span className="font-bold text-slate-900 dark:text-white">-${fee.toFixed(2)}</span>
        </div>
        <div className="mt-2 border-t border-slate-200 pt-2 dark:border-white/10">
          <div className="flex justify-between">
            <span className="font-bold text-slate-900 dark:text-white">Escrow held</span>
            <span className="font-extrabold text-teal-600 dark:text-teal-400">${budgetMin.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepTimeline({ data, update, errors }) {
  const DURATIONS = ["Less than 1 week", "1 to 4 weeks", "1 to 3 months", "3+ months"];
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Timeline & Milestones</h2>

      <Field label="Estimated Duration" error={errors.duration} required>
        <div className="grid grid-cols-2 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => update({ duration: d })} className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors ${data.duration === d ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"}`}>
              {d}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Priority Level">
        <div className="grid grid-cols-3 gap-2">
          {["low", "normal", "high"].map((p) => (
            <button key={p} onClick={() => update({ priority: p })} className={`rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors ${data.priority === p ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-zinc-300"}`}>
              {p}
            </button>
          ))}
        </div>
      </Field>

      <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
          <Sparkles className="h-4 w-4" /> AI Milestone Suggestions
        </p>
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Based on your budget and duration, we suggest splitting this into <b>3 milestones</b> for smoother delivery and escrow protection.
        </p>
        <button className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
          Auto-generate milestones
        </button>
      </div>
    </div>
  );
}

function StepAttachments({ data, update, dragActive, setDragActive }) {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: f.size }));
    update({ attachments: [...data.attachments, ...files] });
  };

  const removeFile = (idx) => update({ attachments: data.attachments.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attachments</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400">Add reference files, designs, or documents to help students understand the project.</p>

      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-300 dark:border-white/10"}`}
      >
        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-zinc-200">Drag files here or click to browse</p>
        <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PNG, JPG, ZIP up to 50MB</p>
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
          <LinkIcon className="h-3.5 w-3.5" /> Add GitHub Repo
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
          <LinkIcon className="h-3.5 w-3.5" /> Add Drive Link
        </button>
      </div>

      {data.attachments.length > 0 && (
        <div className="space-y-2">
          {data.attachments.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</span>
              </div>
              <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepReview({ data }) {
  const score = Math.min(
    100,
    (data.title.length > 10 ? 20 : 0) +
    (data.description.length > 50 ? 20 : 0) +
    (data.skills.length > 0 ? 20 : 0) +
    (data.budgetMin > 0 ? 20 : 0) +
    (data.duration ? 20 : 0)
  );

  const checks = [
    { label: "Clear project title", pass: data.title.length >= 10 },
    { label: "Detailed description (50+ chars)", pass: data.description.length >= 50 },
    { label: "At least one skill selected", pass: data.skills.length > 0 },
    { label: "Budget specified", pass: data.budgetMin > 0 },
    { label: "Timeline defined", pass: !!data.duration },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Quality Review</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400">We analyzed your project for clarity, completeness, and hiring success.</p>

      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-500/5 dark:to-indigo-500/5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Project Quality Score</p>
          <p className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{score}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-400" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center justify-between rounded-xl p-3 ${c.pass ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
            <div className="flex items-center gap-2">
              {c.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">{c.label}</span>
            </div>
            <span className={`text-xs font-bold ${c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {c.pass ? "PASS" : "FIX"}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Predictions</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Expected proposals</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">12 – 18</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Hire success rate</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{score > 80 ? "94%" : "72%"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepPreview({ data }) {
  const budget = data.budgetMin ? `$${data.budgetMin}` : "TBD";
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Preview Your Listing</h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400">This is exactly how students will see your project.</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Sparkles className="h-3 w-3" /> New
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">
            {data.experienceLevel || "Intermediate"}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.title || "Your project title"}</h3>
        <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">{data.description || "Your project description will appear here..."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.skills.map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-zinc-300">{s}</span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs dark:border-white/5">
          <span className="font-bold text-slate-900 dark:text-white">{budget} {data.budgetType || "fixed"}</span>
          <span className="text-slate-500 dark:text-zinc-400">{data.duration || "Duration TBD"}</span>
          <span className="text-slate-500 dark:text-zinc-400">{data.category || "Category TBD"}</span>
        </div>
      </div>
    </div>
  );
}

function StepPublish({ publishing, publish }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      {publishing ? (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Publishing your project...</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Making it live in the marketplace</p>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
            <Rocket className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to publish?</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-zinc-400">
            Your project will be visible to verified students immediately. You can pause or edit it anytime from your dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5">
              Schedule for later
            </button>
            <button onClick={publish} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl">
              <Rocket className="h-4 w-4" /> Publish Now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
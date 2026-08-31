import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { useQuery } from "@tanstack/react-query";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus, Minus, ArrowUpRight, Check, CircleDollarSign, ShieldCheck, Sparkles, Code2, Palette, BarChart3, PenLine, Video, Megaphone, LockKeyhole, BadgeCheck, WalletCards } from "lucide-react";
import { SealMark } from "../auth/components/AuthShell.jsx";
import Strands from "../../components/Strands.jsx";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";
import { listProjects } from "../../services/api/projects.api.js";
import { formatCurrency } from "../../utils/currency.utils.js";

import Button from "../../components/ui/Button.jsx";
import LandingOnboarding from "./LandingOnboarding.jsx";

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const VIEWPORT = { once: true, margin: "-80px" };

const CLIENT_STEPS = [
  {
    n: "01",
    title: "Post a brief",
    body: "Set the outcome, budget range, timeline and required skills. Posting is free and takes about three minutes.",
  },
  {
    n: "02",
    title: "Review proposals",
    body: "Only students with a confirmed university email can apply. Compare bids, delivery times and past work.",
  },
  {
    n: "03",
    title: "Fund a milestone",
    body: "Your payment is held in escrow. The student starts knowing the budget is real and committed.",
  },
  {
    n: "04",
    title: "Approve and release",
    body: "Review the delivery, request revisions if needed, and release the milestone when it meets the brief.",
  },
];

const STUDENT_STEPS = [
  {
    n: "01",
    title: "Verify your university",
    body: "Confirm your student email once. Your verified badge shows on every proposal.",
  },
  {
    n: "02",
    title: "Build your profile",
    body: "Skills, rate, and a short portfolio. Clients read this before your cover letter.",
  },
  {
    n: "03",
    title: "Send focused proposals",
    body: "Answer the brief directly: approach, first deliverable, timeline.",
  },
  {
    n: "04",
    title: "Get paid on approval",
    body: "Milestones are funded before you start, so payment never depends on chasing invoices.",
  },
];

const CATEGORIES = [
  { name: "Development", desc: "Web, mobile and automation builds", icon: Code2, tone: "teal" },
  { name: "Design", desc: "Product, brand and interface work", icon: Palette, tone: "cyan" },
  { name: "Data & Research", desc: "Analysis, dashboards and reports", icon: BarChart3, tone: "blue" },
  { name: "Writing", desc: "Docs, copy and long-form content", icon: PenLine, tone: "amber" },
  { name: "Video & Motion", desc: "Editing, animation and reels", icon: Video, tone: "slate" },
  { name: "Marketing", desc: "Campaigns, SEO and social", icon: Megaphone, tone: "emerald" },
];

const CATEGORY_TONES = {
  teal: "bg-teal-500/10 text-teal-700 ring-teal-500/20 group-hover:bg-teal-500/15",
  cyan: "bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 group-hover:bg-cyan-500/15",
  blue: "bg-blue-500/10 text-blue-700 ring-blue-500/20 group-hover:bg-blue-500/15",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-500/20 group-hover:bg-amber-500/15",
  slate: "bg-slate-500/10 text-slate-700 ring-slate-500/20 group-hover:bg-slate-500/15",
  emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 group-hover:bg-emerald-500/15",
};

const FAQS = [
  {
    q: "What does NexusWork charge?",
    a: "Clients pay no posting fee. A flat service fee is applied to each released milestone, shown before you fund it.",
  },
  {
    q: "How is a student verified?",
    a: "Every student account is tied to a confirmed university email address. Verification is required before applying to any brief.",
  },
  {
    q: "What happens if work isn't delivered?",
    a: "Funds stay in escrow until you approve. If a milestone is not delivered to the brief, you can request changes or open a dispute with the written scope as the record.",
  },
  {
    q: "Can I hire the same student again?",
    a: "Yes. Repeat contracts can be created directly from your dashboard without reposting the brief.",
  },
];

const TRUST_SIGNALS = [
  { title: "Escrow-protected", body: "Funds held until work is approved" },
  { title: "University-verified", body: "Every student's enrollment is confirmed" },
  { title: "No hidden fees", body: "One clear commission, shown up front" },
];

const STATS = [
  { value: "1,200+", label: "Verified students" },
  { value: "$180K+", label: "Held in escrow" },
  { value: "40+", label: "Universities" },
];

const TESTIMONIALS = [
  {
    quote:
      "We had a landing page redesigned and shipped in under two weeks. Funds sat in escrow the whole time, so there was never a moment I wondered if the student would deliver.",
    name: "Maya Reinholt",
    role: "Founder, Loomstate Coffee",
  },
  {
    quote:
      "Milestones being funded up front changed everything for me. I could plan my week around real, committed work instead of chasing invoices between classes.",
    name: "Daniel Osei",
    role: "Computer Science, Georgia Tech",
  },
  {
    quote:
      "Every proposal we got was from a verified student, so screening took minutes instead of days. We've hired the same designer for three projects now.",
    name: "Priya Chandrasekar",
    role: "Marketing Lead, Fernbank Analytics",
  },
];

const btnPrimary =
  "inline-flex items-center justify-center h-11 px-6 rounded-control bg-brass text-ink text-[15px] font-bold tracking-tight hover:bg-brass-300 active:scale-[0.99] transition-all w-full sm:w-auto";

const btnSecondary =
  "inline-flex items-center justify-center h-11 px-6 rounded-control border border-ink-300 text-slate text-[15px] font-bold tracking-tight hover:border-brass/40 hover:bg-ink-50 active:scale-[0.99] transition-all w-full sm:w-auto";

function SectionHeading({ eyebrow, title, subtitle, align = "left" }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={FADE_UP}
      className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
    >
      {eyebrow && (
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">{eyebrow}</p>
      )}
      <h2 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight text-content-primary sm:text-[2.125rem]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3.5 font-sans text-base leading-relaxed text-content-secondary">{subtitle}</p>
      )}
    </motion.div>
  );
}

/**
 * Auto-rotating testimonial strip for the hero. Pauses on hover/focus and
 * when the tab isn't visible, respects prefers-reduced-motion, and exposes
 * accessible manual controls so it never traps a keyboard or screen-reader
 * user in a moving carousel.
 */
function HeroTestimonial() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || paused || TESTIMONIALS.length <= 1) return undefined;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => clearInterval(timerRef.current);
  }, [paused]);

  useEffect(() => {
    const handleVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const { quote, name, role } = TESTIMONIALS[index];
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-card border border-border-strong bg-surface-elevated p-6 text-left shadow-elevated sm:p-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* accent glow + top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl"
        aria-hidden="true"
      />

      <span aria-hidden="true" className="font-display text-5xl leading-none text-brass/30">
        “
      </span>

      <p
        aria-live="polite"
        className="relative -mt-2 min-h-[7em] text-base italic leading-relaxed text-slate-200 sm:text-lg"
      >
        {quote}
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-ink-300/60 pt-5">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/15 text-sm font-semibold text-brass ring-1 ring-brass/30"
          >
            {initials}
          </span>
          <span>
            <p className="text-sm font-semibold tracking-tight text-slate">{name}</p>
            <p className="text-xs text-slate-400">{role}</p>
          </span>
        </div>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose testimonial">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show testimonial from ${t.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 ${
                i === index ? "bg-brass" : "bg-ink-300 hover:bg-ink-300/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroMarketplaceVisual() {
  const { data } = useQuery({
    queryKey: ["projects", "hero-preview"],
    queryFn: () => listProjects(),
  });
  const project = data?.data?.[0];
  const skills = project?.required_skills?.slice(0, 3) || ["React", "UX research", "2–3 weeks"];

  return (
    <div className="hero-marketplace-visual relative w-full max-w-[570px] overflow-hidden rounded-[20px] border border-[#286174] bg-[#062333] p-4 shadow-[0_24px_70px_rgba(3,42,55,0.28)] sm:p-6" aria-label="NexusWork product preview">
      <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden="true">
        <Strands colors={["#00c8b4", "#2788b0", "#7ce3d1"]} count={4} speed={0.3} opacity={0.7} scale={1.2} glow={1.4} intensity={0.45} />
      </div>
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#65e6b4] shadow-[0_0_12px_#65e6b4]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#72dacc]">NexusWork marketplace</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">A clearer path from brief to delivery</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-[#b8f2e8]">
          Product preview
        </span>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-[1fr_0.9fr]">
        <Link to={project?._id ? `/projects/${project._id}` : "/projects"} className="group rounded-control border border-white/10 bg-[#0a3042]/90 p-4 transition-colors hover:border-[#62d9cc]/70 hover:bg-[#0d394b]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa8b4]">Example brief</p>
              <p className="mt-1.5 line-clamp-2 text-sm font-bold text-white">{project?.title || "Explore open student projects"}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[#6ce1d0] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {skills.map((tag) => <span key={tag} className="rounded bg-white/8 px-2 py-1 text-[10px] font-medium text-[#b7d6d8]">{tag}</span>)}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[11px] text-[#8db6bf]">Explore real open briefs</span>
            <span className="text-sm font-bold text-[#7ce3d1]">Browse →</span>
          </div>
        </Link>

        <Link to="#how-it-works" className="group rounded-control border border-[#2b7580] bg-[#0b3b4a]/95 p-4 transition-colors hover:border-[#72e1c8] hover:bg-[#0e4352]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7aa8b4]">Illustrative milestone</p>
            <ShieldCheck className="h-4 w-4 text-[#72e1c8]" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">{project ? formatCurrency(project.budget) : "Protected escrow"}</p>
          <p className="mt-1 text-[11px] text-[#9ac6c6]">Funds stay protected until approval</p>
          <div className="mt-5 space-y-2.5">
            {[['Brief agreed', true], ['Student working', true], ['Release on approval', false]].map(([label, done]) => (
              <div key={label} className="flex items-center gap-2 text-[11px] text-[#c5e0df]">
                <span className={`grid h-4 w-4 place-items-center rounded-full ${done ? 'bg-[#65d9b4] text-[#07313a]' : 'border border-[#55939a] text-transparent'}`}><Check className="h-2.5 w-2.5" /></span>
                {label}
              </div>
            ))}
          </div>
        </Link>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-3 rounded-control border border-white/10 bg-[#082c3c]/90 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d3f7ed] text-[#08756b]"><Sparkles className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white">Verified talent, clear delivery</p><p className="mt-0.5 truncate text-[10px] text-[#8db6bf]">One workspace for proposals, milestones and payment.</p></div>
        <CircleDollarSign className="h-5 w-5 shrink-0 text-[#6ce1d0]" />
      </div>
    </div>
  );
}

function HeroTrustBar() {
  const { data } = useQuery({ queryKey: ["projects", "hero-preview"], queryFn: () => listProjects() });
  const project = data?.data?.[0];
  const client = project?.client_id?.client_profile?.organization_name || project?.client_id?.name;
  const context = project?.title ? `Live brief: ${project.title}` : "Students, clients and universities moving work forward together.";
  const initials = (client || "NW")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex w-full max-w-[570px] items-center gap-3 rounded-control border border-border-subtle bg-surface px-4 py-3 shadow-card">
      <div className="flex -space-x-2" aria-hidden="true">
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-[#b7e2d8] text-[9px] font-bold text-[#17695f]">{initials}</span>
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-[#c7d9ef] text-[9px] font-bold text-[#31557f]">ST</span>
      </div>
      <p className="text-xs leading-relaxed text-content-secondary"><span className="font-bold text-content-primary">{client ? `${client} is hiring.` : "Built on trust."}</span> {context}</p>
      <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-brand" />
    </div>
  );
}

function HeroVideoBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        className="absolute inset-0 h-full w-full object-cover object-[68%_50%] opacity-100 saturate-150 contrast-125"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero-poster.svg"
      >
        <source src="/videos/herobg.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

function OpenRightNow() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "landing"],
    queryFn: () => listProjects(),
  });

  const projects = (data?.data ?? []).slice(0, 4);

  return (
    <section className="border-b border-border-subtle bg-canvas px-6 py-20 sm:px-10 lg:px-16" aria-label="Open projects">
      <div className="w-full">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow={t("landing.openNow.eyebrow")} title={t("landing.openNow.title")} subtitle={t("landing.openNow.subtitle")} />
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-control border border-border-strong bg-surface px-4 py-2.5 text-sm font-bold text-brand-dark shadow-subtle transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-card"
        >
          {t("landing.openNow.seeAll")} <ArrowUpRight className="h-4 w-4" />
        </Link>
        </div>

      {isLoading && (
        <div className="flex justify-center rounded-card border border-border-subtle bg-surface py-14 shadow-card">
          <Spinner />
        </div>
      )}

      {error && (
        <p className="rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm font-medium text-brick">
          {error.message}
        </p>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div className="rounded-card border border-border-subtle bg-surface px-6 py-12 text-center shadow-card">
          <p className="text-sm font-semibold text-content-secondary">
            No open projects right now. Check back soon!
          </p>
        </div>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();

  const clientSteps = [
    { n: "01", title: t("landing.howItWorks.step1ClientTitle"), body: t("landing.howItWorks.step1ClientBody") },
    { n: "02", title: t("landing.howItWorks.step2ClientTitle"), body: t("landing.howItWorks.step2ClientBody") },
    { n: "03", title: t("landing.howItWorks.step3ClientTitle"), body: t("landing.howItWorks.step3ClientBody") },
    { n: "04", title: t("landing.howItWorks.step4ClientTitle"), body: t("landing.howItWorks.step4ClientBody") },
  ];

  const studentSteps = [
    { n: "01", title: t("landing.howItWorks.step1StudentTitle"), body: t("landing.howItWorks.step1StudentBody") },
    { n: "02", title: t("landing.howItWorks.step2StudentTitle"), body: t("landing.howItWorks.step2StudentBody") },
    { n: "03", title: t("landing.howItWorks.step3StudentTitle"), body: t("landing.howItWorks.step3StudentBody") },
    { n: "04", title: t("landing.howItWorks.step4StudentTitle"), body: t("landing.howItWorks.step4StudentBody") },
  ];

  const categories = [
    { name: t("landing.categories.devTitle"), desc: t("landing.categories.devDesc"), icon: Code2, tone: "teal" },
    { name: t("landing.categories.designTitle"), desc: t("landing.categories.designDesc"), icon: Palette, tone: "cyan" },
    { name: t("landing.categories.dataTitle"), desc: t("landing.categories.dataDesc"), icon: BarChart3, tone: "blue" },
    { name: t("landing.categories.writingTitle"), desc: t("landing.categories.writingDesc"), icon: PenLine, tone: "amber" },
    { name: t("landing.categories.videoTitle"), desc: t("landing.categories.videoDesc"), icon: Video, tone: "slate" },
    { name: t("landing.categories.marketingTitle"), desc: t("landing.categories.marketingDesc"), icon: Megaphone, tone: "emerald" },
  ];

  const faqs = [
    { q: t("landing.faqs.q1"), a: t("landing.faqs.a1") },
    { q: t("landing.faqs.q2"), a: t("landing.faqs.a2") },
    { q: t("landing.faqs.q3"), a: t("landing.faqs.a3") },
    { q: t("landing.faqs.q4"), a: t("landing.faqs.a4") },
  ];

  const trustSignals = [
    { title: t("landing.trust.escrowTitle"), body: t("landing.trust.escrowBody") },
    { title: t("landing.trust.verifiedTitle"), body: t("landing.trust.verifiedBody") },
    { title: t("landing.trust.noFeesTitle"), body: t("landing.trust.noFeesBody") },
  ];

  const stats = [
    { value: "1,200+", label: t("landing.stats.students") },
    { value: "$180K+", label: t("landing.stats.escrow") },
    { value: "40+", label: t("landing.stats.universities") },
  ];

  return (
    <div className="bg-canvas">
      <LandingOnboarding />
      <section className="relative overflow-hidden border-b border-border-subtle bg-canvas" aria-label="Hero">
        <HeroVideoBackground />

        <motion.div
          className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1440px] items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-14 lg:py-16 xl:px-20"
          initial="hidden"
          animate="show"
          variants={STAGGER_CONTAINER}
        >
          <div className="hero-copy-panel max-w-xl text-center lg:text-left">
            <motion.h1
              variants={FADE_UP}
              className="font-display text-[2.7rem] font-extrabold leading-[1.03] tracking-[-0.04em] text-content-primary sm:text-[4.25rem]"
            >
              {t("landing.heroTitle")}
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-content-secondary sm:text-lg lg:mx-0"
            >
              {t("landing.heroSubtitle")}
            </motion.p>

            <motion.div
              variants={FADE_UP}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link to="/projects" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">{t("landing.openNow.seeAll")}</Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">{t("landing.postBrief")}</Button>
              </Link>
            </motion.div>

            <motion.div
              variants={FADE_UP}
              className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border-subtle pt-7 lg:mx-0"
            >
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-display text-2xl tracking-tight text-brand-dark sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-content-muted">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={FADE_UP} className="flex w-full flex-col items-center gap-4 lg:items-end">
            <HeroMarketplaceVisual />
            <HeroTrustBar />
          </motion.div>
        </motion.div>
      </section>

      <section className="border-b border-border-subtle bg-surface-soft" aria-label="Trust signals">
        <div className="grid w-full grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3 sm:px-10 lg:px-16">
          {trustSignals.map(({ title, body }, index) => (
            <div key={title} className="flex items-center gap-3 rounded-control border border-border-subtle bg-surface px-4 py-3 shadow-subtle">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-dark">
                {index === 0 ? <LockKeyhole className="h-4 w-4" /> : index === 1 ? <BadgeCheck className="h-4 w-4" /> : <WalletCards className="h-4 w-4" />}
              </span>
              <div><p className="font-display text-sm font-bold tracking-tight text-content-primary">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-content-muted">{body}</p></div>
            </div>
          ))}
        </div>
      </section>


      <OpenRightNow />

      <section className="border-y border-border-subtle bg-surface-soft" aria-label="Customer stories">
        <div className="grid w-full items-center gap-10 px-6 py-18 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-16">
          <SectionHeading
            eyebrow={t("landing.stories.eyebrow")}
            title={t("landing.stories.title")}
            subtitle={t("landing.stories.subtitle")}
          />
          <HeroTestimonial />
        </div>
      </section>

      <section className="border-b border-border-subtle bg-surface-soft" aria-label="Categories">
        <div className="w-full px-6 py-20 sm:px-10 lg:px-16">
          <SectionHeading
            eyebrow={t("landing.categories.eyebrow")}
            title={t("landing.categories.title")}
            subtitle={t("landing.heroSubtitle")}
          />

          <motion.div
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            variants={STAGGER_CONTAINER}
          >
            {categories.map(({ name, desc, icon: Icon, tone }) => (
              <motion.div key={name} variants={FADE_UP}>
                <Link
                  to={`/projects?category=${encodeURIComponent(name)}`}
                  className="group block h-full rounded-card border border-border-subtle bg-surface p-5 shadow-subtle transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-elevated"
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-control ring-1 transition-colors ${CATEGORY_TONES[tone]}`}><Icon className="h-5 w-5" /></span>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="font-display text-lg font-bold tracking-tight text-content-primary transition-colors group-hover:text-brand-dark">{name}</p>
                    <ArrowUpRight className="h-4 w-4 text-content-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">{desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="w-full scroll-mt-24 bg-canvas px-6 py-20 sm:px-10 lg:px-16" aria-label="How it works">
        <div className="w-full">
        <SectionHeading
          align="center"
          eyebrow={t("landing.howItWorks.eyebrow")}
          title={t("landing.howItWorks.title")}
          subtitle={t("landing.heroSubtitle")}
        />

        <div className="mb-4 mt-12 flex items-center gap-3"><span className="h-px w-8 bg-brand" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">{t("landing.howItWorks.clientTab")}</p></div>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={STAGGER_CONTAINER}
        >
          {clientSteps.map((step) => (
            <motion.article
              key={step.n}
              variants={FADE_UP}
              className="rounded-card border border-border-subtle bg-surface p-5 shadow-subtle transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-card"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brass/12 font-mono text-xs font-bold text-brass">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-slate">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brass">
              {t("landing.howItWorks.studentTab")}
            </p>
            <h3 className="font-display text-xl font-extrabold leading-snug tracking-tight text-slate sm:text-2xl">
              {t("landing.heroTitle")}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              {t("landing.heroSubtitle")}
            </p>
            <Link to="/register" className="mt-6 inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">{t("landing.cta.getStarted")}</Button>
            </Link>
          </div>

          <motion.div
            className="grid gap-px overflow-hidden rounded-card border border-border-subtle bg-border-subtle shadow-card sm:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            variants={STAGGER_CONTAINER}
          >
            {studentSteps.map((step) => (
              <motion.article key={step.n} variants={FADE_UP} className="bg-surface p-5 transition-colors hover:bg-surface-soft sm:p-6">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brass/12 font-mono text-xs font-bold text-brass">
                  {step.n}
                </span>
                <h4 className="mt-3 font-display text-base font-bold tracking-tight text-slate">{step.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-y border-border-subtle bg-surface-soft" aria-label="Frequently asked questions">
        <div className="w-full px-6 py-20 sm:px-10 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionHeading eyebrow={t("landing.faqs.eyebrow")} title={t("landing.faqs.title")} />
            </div>

            <AccordionPrimitive.Root
              type="single"
              collapsible
              defaultValue="faq-0"
              className="overflow-hidden rounded-card border border-border-subtle bg-surface shadow-card"
            >
              {faqs.map(({ q, a }, i) => (
                <AccordionPrimitive.Item key={q} value={`faq-${i}`} className="group border-b border-border-subtle last:border-b-0">
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50 sm:px-6">
                      <span className="font-display text-lg font-bold tracking-tight text-slate transition-colors group-hover:text-brass sm:text-xl">
                        {q}
                      </span>
                      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border-strong text-content-secondary transition-colors group-hover:border-brand/40 group-data-[state=open]:border-brand group-data-[state=open]:bg-brand-soft group-data-[state=open]:text-brand">
                        <Plus className="h-4 w-4 transition-opacity group-data-[state=open]:opacity-0" />
                        <Minus className="absolute h-4 w-4 opacity-0 transition-opacity group-data-[state=open]:opacity-100" />
                      </span>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="px-5 pb-5 pr-14 text-[15px] leading-relaxed text-content-secondary sm:px-6">{a}</p>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>
        </div>
      </section>

      {/* ── Full-Width Edge-to-Edge CTA Section ── */}
      <section className="relative w-full overflow-hidden border-y border-[#1f5364] bg-[#062333] py-24 sm:py-32 lg:py-36" aria-label="Call to action">
        {/* Glow ambient background lights */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brass/20 blur-[100px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brass/25 blur-[100px]" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-10 lg:px-16">
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("landing.cta.title")}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            {t("landing.cta.subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-14 w-full items-center justify-center rounded-control bg-brass px-9 text-base font-extrabold tracking-tight text-ink shadow-elevated transition-all hover:bg-brass-300 hover:scale-[1.02] sm:w-auto"
            >
              {t("landing.postBrief")}
            </Link>
            <Link
              to="/projects"
              className="inline-flex h-14 w-full items-center justify-center rounded-control border-2 border-brass/50 bg-brass/10 px-9 text-base font-extrabold tracking-tight text-brass transition-all hover:bg-brass/20 hover:scale-[1.02] sm:w-auto"
            >
              {t("landing.cta.browseTalent")} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

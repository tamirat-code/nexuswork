import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus, Minus } from "lucide-react";
import { SealMark } from "../auth/components/AuthShell.jsx";
import Strands from "../../components/Strands.jsx";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";
import { listProjects } from "../../services/api/projects.api.js";

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
  { name: "Development", desc: "Web, mobile and automation builds" },
  { name: "Design", desc: "Product, brand and interface work" },
  { name: "Data & Research", desc: "Analysis, dashboards and reports" },
  { name: "Writing", desc: "Docs, copy and long-form content" },
  { name: "Video & Motion", desc: "Editing, animation and reels" },
  { name: "Marketing", desc: "Campaigns, SEO and social" },
];

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
  "inline-flex items-center justify-center h-11 px-6 rounded-control bg-brass text-ink text-sm font-semibold tracking-tight hover:bg-brass-300 active:scale-[0.99] transition-all w-full sm:w-auto";

const btnSecondary =
  "inline-flex items-center justify-center h-11 px-6 rounded-control border border-ink-300 text-slate text-sm font-semibold tracking-tight hover:border-brass/40 hover:bg-ink-50 active:scale-[0.99] transition-all w-full sm:w-auto";

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
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">{eyebrow}</p>
      )}
      <h2 className="font-display text-2xl leading-tight tracking-tight text-slate sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-300">{subtitle}</p>}
    </motion.div>
  );
}

function OpenRightNow() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "landing"],
    queryFn: () => listProjects(),
  });

  const projects = (data?.data ?? []).slice(0, 4);

  return (
    <section className="w-full px-6 py-20 sm:px-10 lg:px-24" aria-label="Open projects">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Open right now" subtitle="Fresh briefs from clients hiring this week." />
        <Link
          to="/projects"
          className="text-sm font-semibold text-brass transition-colors hover:text-brass-300"
        >
          See all projects →
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center rounded-card border border-ink-300 bg-ink-50 py-14">
          <Spinner />
        </div>
      )}

      {error && (
        <p className="rounded-card border border-brick/30 bg-brick-100 px-4 py-3 text-sm text-brick">
          {error.message}
        </p>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <p className="rounded-card border border-ink-300 bg-ink-50 px-5 py-8 text-center text-sm text-slate-300">
          No open projects yet — check back soon.
        </p>
      )}

      {projects.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={STAGGER_CONTAINER}
        >
          {projects.map((project) => (
            <motion.div key={project._id} variants={FADE_UP}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
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
      className="relative mx-auto w-full max-w-md overflow-hidden rounded-card border border-ink-300/60 bg-gradient-to-b from-ink-50/90 to-ink-100/80 p-6 text-left shadow-elevated backdrop-blur-sm sm:p-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* accent glow + top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brass to-transparent" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brass/10 blur-3xl"
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

export default function LandingPage() {
  return (
    <div className="bg-ink">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-ink" aria-label="Hero">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Strands
            colors={["#00c8b4", "#0e7fa3", "#7C3AED"]}
            count={5}
            speed={0.5}
            opacity={0.45}
            scale={1.4}
            glow={2.4}
            intensity={0.6}
          />
        </div>
        <div
          className="absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-b from-transparent to-ink"
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10 flex w-full flex-col items-center gap-12 px-6 py-20 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-24 lg:px-12 xl:px-20"
          initial="hidden"
          animate="show"
          variants={STAGGER_CONTAINER}
        >
          <div className="text-center lg:max-w-xl lg:flex-shrink-0 lg:text-left">
            <motion.div variants={FADE_UP} className="flex justify-center lg:justify-start">
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brass">
                <SealMark className="h-3.5 w-3.5" />
                University-verified students only
              </span>
            </motion.div>

            <motion.h1
              variants={FADE_UP}
              className="font-display text-[2.5rem] leading-[1.05] tracking-tight text-slate sm:text-[3.5rem]"
            >
              Where student talent meets{" "}
              <em className="not-italic text-brass">real,&nbsp;paid&nbsp;work</em>.
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0"
            >
              NexusWork connects verified university students with clients who need projects done — with
              every milestone held in escrow until the work is approved.
            </motion.p>

            <motion.div
              variants={FADE_UP}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link to="/projects" className={btnPrimary}>
                Browse open projects
              </Link>
              <Link to="/register" className={btnSecondary}>
                Post a project
              </Link>
            </motion.div>

            <motion.div
              variants={FADE_UP}
              className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-ink-300/60 pt-8 lg:mx-0"
            >
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-display text-2xl tracking-tight text-brass sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-slate-300">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={FADE_UP} className="flex w-full justify-center lg:w-auto lg:flex-shrink-0 lg:justify-end">
            <HeroTestimonial />
          </motion.div>
        </motion.div>
      </section>

      <section className="border-y border-ink-300 bg-ink-50" aria-label="Trust signals">
        <div className="grid w-full grid-cols-1 gap-6 px-6 py-6 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ink-300 sm:px-10 lg:px-24">
          {TRUST_SIGNALS.map(({ title, body }) => (
            <div key={title} className="px-4">
              <p className="text-sm font-semibold tracking-tight text-slate">{title}</p>
              <p className="mt-1 text-xs text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>


      <OpenRightNow />

      <section className="border-t border-ink-300 bg-ink-50" aria-label="Categories">
        <div className="w-full px-6 py-20 sm:px-10 lg:px-24">
          <SectionHeading
            eyebrow="Browse by discipline"
            title="Categories students work in"
            subtitle="Every category is staffed by students whose enrollment has been verified by their university."
          />

          <motion.div
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            variants={STAGGER_CONTAINER}
          >
            {CATEGORIES.map(({ name, desc }) => (
              <motion.div key={name} variants={FADE_UP}>
                <Link
                  to={`/projects?category=${encodeURIComponent(name)}`}
                  className="group block h-full rounded-card border border-ink-300 bg-ink p-5 shadow-card transition-colors hover:border-brass/40"
                >
                  <p className="font-display text-base tracking-tight text-slate transition-colors group-hover:text-brass">
                    {name}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="w-full scroll-mt-24 px-6 py-20 sm:px-10 lg:px-24" aria-label="How it works">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Real work, funded before it starts"
          subtitle="NexusWork removes the two things that break student freelancing: unverified profiles and unpaid invoices."
        />

        <p className="mb-4 mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
          For clients
        </p>
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={STAGGER_CONTAINER}
        >
          {CLIENT_STEPS.map((step) => (
            <motion.article
              key={step.n}
              variants={FADE_UP}
              className="rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card"
            >
              <p className="font-mono text-xs text-brass">{step.n}</p>
              <h3 className="mt-2 font-display text-base tracking-tight text-slate">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
              For students
            </p>
            <h3 className="font-display text-xl leading-snug tracking-tight text-slate sm:text-2xl">
              Paid, portfolio-grade work that fits around a degree
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              With the payment terms agreed before you write a line of code or open Figma.
            </p>
            <Link to="/register" className={`${btnPrimary} mt-6`}>
              Join as a student
            </Link>
          </div>

          <motion.div
            className="grid gap-px overflow-hidden rounded-card border border-ink-300 bg-ink-300 sm:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            variants={STAGGER_CONTAINER}
          >
            {STUDENT_STEPS.map((step) => (
              <motion.article key={step.n} variants={FADE_UP} className="bg-ink p-5">
                <p className="font-mono text-xs text-brass">{step.n}</p>
                <h4 className="mt-2 font-display text-base tracking-tight text-slate">{step.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.body}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 border-t border-ink-300 bg-ink-50" aria-label="Frequently asked questions">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <SectionHeading eyebrow="FAQ" title="Questions" />
            </div>

            <AccordionPrimitive.Root
              type="single"
              collapsible
              defaultValue="faq-0"
              className="border-t border-ink-300"
            >
              {FAQS.map(({ q, a }, i) => (
                <AccordionPrimitive.Item key={q} value={`faq-${i}`} className="group border-b border-ink-300">
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50">
                      <span className="font-display text-base tracking-tight text-slate transition-colors group-hover:text-brass sm:text-lg">
                        {q}
                      </span>
                      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink-300 text-slate transition-colors group-hover:border-brass/40 group-data-[state=open]:border-brass group-data-[state=open]:bg-brass/10 group-data-[state=open]:text-brass">
                        <Plus className="h-4 w-4 transition-opacity group-data-[state=open]:opacity-0" />
                        <Minus className="absolute h-4 w-4 opacity-0 transition-opacity group-data-[state=open]:opacity-100" />
                      </span>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="pb-5 pr-14 text-sm leading-relaxed text-slate-300">{a}</p>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>

          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className={btnPrimary}>
              Post a project
            </Link>
            <Link to="/projects" className={btnSecondary}>
              Browse open projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
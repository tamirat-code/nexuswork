import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SealMark } from "../auth/components/AuthShell.jsx";
import Strands from "../../components/Strands.jsx";
import ProjectCard from "../../components/cards/ProjectCard.jsx";
import Spinner from "../../components/loaders/Spinner.jsx";
import { listProjects } from "../../services/api/projects.api.js";

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const CLIENT_STEPS = [
  {
    n: "01",
    icon: "📄",
    title: "Post a brief",
    body: "Set the outcome, budget range, timeline and required skills. Posting is free and takes about three minutes.",
  },
  {
    n: "02",
    icon: "💬",
    title: "Review proposals",
    body: "Only students with a confirmed university email can apply. Compare bids, delivery times and past work.",
  },
  {
    n: "03",
    icon: "🛡️",
    title: "Fund a milestone",
    body: "Your payment is held in escrow. The student starts knowing the budget is real and committed.",
  },
  {
    n: "04",
    icon: "💳",
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

const CATEGORIES = ["Development", "Design", "Data & Research", "Writing", "Video & Motion", "Marketing"];

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
  {
    title: "Escrow-protected",
    body: "Funds held until work is approved",
  },
  {
    title: "University-verified",
    body: "Every student's enrollment is confirmed",
  },
  {
    title: "No hidden fees",
    body: "One clear commission, shown up front",
  },
];

const btnPrimary =
  "inline-flex items-center justify-center h-12 px-7 rounded-control bg-brass text-ink text-sm font-semibold hover:bg-brass-300 active:scale-[0.98] transition-all w-full sm:w-auto";

const btnSecondary =
  "inline-flex items-center justify-center h-12 px-7 rounded-control border border-ink-300 text-slate text-sm font-semibold hover:bg-ink-50 active:scale-[0.98] transition-all w-full sm:w-auto";

function OpenRightNow() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "landing"],
    queryFn: () => listProjects(),
  });

  const projects = (data?.data ?? []).slice(0, 4);

  return (
    <section className="mx-auto max-w-5xl px-6 py-24" aria-label="Open projects">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        variants={FADE_UP}
        className="mb-10 flex items-end justify-between"
      >
        <div>
          <h2 className="font-display text-2xl text-slate">Open right now</h2>
          <p className="mt-1 text-sm text-slate-300">Fresh briefs from clients hiring this week.</p>
        </div>
        <Link to="/projects" className="text-sm font-semibold text-brass hover:text-brass-300">
          See all projects
        </Link>
      </motion.div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && <p className="text-sm text-brick">{error.message}</p>}

      {!isLoading && !error && projects.length === 0 && (
        <p className="text-sm text-slate-300">No open projects yet — check back soon.</p>
      )}

      {projects.length > 0 && (
        <motion.div
          className="grid gap-5 sm:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
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

export default function LandingPage() {
  return (
    <div className="bg-ink">
      <main>
        <section
          className="relative overflow-hidden bg-ink"
          aria-label="Hero"
        >
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <Strands
              colors={["#00c8b4", "#0e7fa3", "#7C3AED"]}
              count={5}
              speed={0.5}
              opacity={0.5}
              scale={1.4}
              glow={2.4}
              intensity={0.6}
            />
          </div>

          <motion.div
            className="relative z-10 mx-auto max-w-5xl px-6 pb-28 pt-24 text-center sm:pb-36 sm:pt-32"
            initial="hidden"
            animate="show"
            variants={STAGGER_CONTAINER}
          >
            <motion.div variants={FADE_UP}>
              <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-3 py-1 text-xs font-semibold text-brass">
                <SealMark className="h-3.5 w-3.5" />
                University-verified students only
              </span>
            </motion.div>

            <motion.h1
              variants={FADE_UP}
              className="mx-auto max-w-3xl font-display text-4xl leading-[1.08] text-slate sm:text-6xl"
            >
              Where student talent meets{" "}
              <em className="not-italic text-brass">real,&nbsp;paid&nbsp;work</em>.
            </motion.h1>

            <motion.p
              variants={FADE_UP}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300"
            >
              NexusWork connects verified university students with clients who
              need projects done — with every milestone held in escrow until the
              work is approved.
            </motion.p>

            <motion.div
              variants={FADE_UP}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link to="/projects" className={btnPrimary}>
                Browse open projects
              </Link>
              <Link to="/register" className={btnSecondary}>
                Post a project
              </Link>
            </motion.div>
          </motion.div>
        </section>

        <section
          className="border-y border-ink-300 bg-ink-50"
          aria-label="Trust signals"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-6 text-center sm:grid-cols-3 sm:divide-x sm:divide-ink-300 sm:gap-0">
            {TRUST_SIGNALS.map(({ title, body }) => (
              <div key={title} className="px-4">
                <p className="text-sm font-semibold text-slate">{title}</p>
                <p className="mt-0.5 text-xs text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <OpenRightNow />

        <section className="mx-auto max-w-5xl px-6 py-24" aria-label="Categories">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_UP}
            className="mb-10"
          >
            <h2 className="font-display text-2xl text-slate">Categories students work in</h2>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={STAGGER_CONTAINER}
          >
            {CATEGORIES.map((cat) => (
              <motion.div key={cat} variants={FADE_UP}>
                <Link
                  to={`/projects?category=${encodeURIComponent(cat)}`}
                  className="block rounded-card border border-ink-300 bg-ink-50 p-5 shadow-card transition-colors hover:border-brass/30"
                >
                  <p className="font-display text-lg text-slate">{cat}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="border-t border-ink-300 bg-ink-50" aria-label="How it works">
          <div className="mx-auto max-w-5xl px-6 py-28">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={FADE_UP}
              className="mb-16 text-center"
            >
              <h2 className="font-display text-3xl text-slate">Real work, funded before it starts</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                NexusWork removes the two things that break student freelancing: unverified profiles and unpaid
                invoices. Every account is university-verified and every milestone is funded in escrow.
              </p>
            </motion.div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brass">For clients</p>
            <motion.div
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={STAGGER_CONTAINER}
            >
              {CLIENT_STEPS.map((step) => (
                <motion.article
                  key={step.n}
                  variants={FADE_UP}
                  className="rounded-card border border-ink-300 bg-ink p-6 shadow-card"
                >
                  <span className="text-xl" aria-hidden="true">{step.icon}</span>
                  <p className="mt-3 font-mono text-xs text-brass">{step.n}</p>
                  <h3 className="mb-1.5 mt-1 font-display text-lg text-slate">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{step.body}</p>
                </motion.article>
              ))}
            </motion.div>

            <div className="mt-20 grid gap-10 lg:grid-cols-[280px_1fr] lg:items-start">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brass">For students</p>
                <h3 className="font-display text-2xl text-slate">
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
                viewport={{ once: true, margin: "-60px" }}
                variants={STAGGER_CONTAINER}
              >
                {STUDENT_STEPS.map((step) => (
                  <motion.article key={step.n} variants={FADE_UP} className="bg-ink p-6">
                    <p className="font-mono text-xs text-brass">{step.n}</p>
                    <h4 className="mb-1.5 mt-1 font-display text-lg text-slate">{step.title}</h4>
                    <p className="text-sm leading-relaxed text-slate-300">{step.body}</p>
                  </motion.article>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 py-24" aria-label="Questions">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_UP}
            className="mb-10 font-display text-2xl text-slate"
          >
            Questions
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={STAGGER_CONTAINER}
            className="divide-y divide-ink-300"
          >
            {FAQS.map(({ q, a }) => (
              <motion.div key={q} variants={FADE_UP} className="py-5">
                <h3 className="font-display text-lg text-slate">{q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{a}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className={btnPrimary}>
              Post a project
            </Link>
            <Link to="/projects" className={btnSecondary}>
              Browse open projects
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
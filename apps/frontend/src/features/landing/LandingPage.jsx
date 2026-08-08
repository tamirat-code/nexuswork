import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SealMark } from "../auth/components/AuthShell.jsx";
import Strands from "../../components/Strands.jsx";

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

const STEPS = [
  {
    n: "01",
    title: "Post the work",
    body: "Clients describe the project, the skills it needs, and a budget. Live in minutes.",
  },
  {
    n: "02",
    title: "A verified student proposes",
    body: "Only students with confirmed university enrollment can submit proposals — no anonymous bids.",
  },
  {
    n: "03",
    title: "Funds sit in escrow",
    body: "The client funds each milestone up front. The money is held, not spent, until the work is approved.",
  },
  {
    n: "04",
    title: "Approve, and it's released",
    body: "Once the client signs off, payment goes straight to the student. No invoicing back and forth.",
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

        <section
          className="mx-auto max-w-5xl px-6 py-28"
          aria-label="How it works"
        >
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_UP}
            className="mb-16 text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brass">
              How it works
            </p>
            <h2 className="font-display text-3xl text-slate">
              From posted to paid, in four steps
            </h2>
          </motion.div>

          <motion.div
            className="grid gap-5 sm:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={STAGGER_CONTAINER}
          >
            {STEPS.map((step) => (
              <motion.article
                key={step.n}
                variants={FADE_UP}
                className="group rounded-card border border-ink-300 bg-ink-50 p-6 shadow-card transition-colors hover:border-brass/30"
              >
                <span className="font-mono text-xs text-brass">{step.n}</span>
                <h3 className="mb-1.5 mt-2 font-display text-lg text-slate">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {step.body}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section className="bg-ink-50" aria-label="Call to action">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <SealMark className="mx-auto mb-6 h-10 w-10 text-brass" />
            <h2 className="mb-4 font-display text-3xl text-slate">
              Ready to get started?
            </h2>
            <p className="mb-10 text-slate-300">
              Whether you're hiring or looking for work, your first move is one
              click away.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className={btnPrimary}>
                Create your account
              </Link>
              <Link to="/projects" className={btnSecondary}>
                Browse projects first
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-300 bg-ink">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <SealMark className="h-4 w-4 text-brass" />
            <span>&copy; {new Date().getFullYear()} NexusWork</span>
          </div>
          <nav aria-label="Footer" className="flex gap-6 text-sm text-slate-300">
            <Link to="/terms" className="transition-colors hover:text-slate">
              Terms
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-slate">
              Privacy
            </Link>
            <Link to="/contact" className="transition-colors hover:text-slate">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

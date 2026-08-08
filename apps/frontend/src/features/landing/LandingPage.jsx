import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SealMark } from "../auth/components/AuthShell.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const steps = [
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

export default function LandingPage() {
  return (
    <div className="bg-paper">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #14213D 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brass-300 bg-brass-100 px-3 py-1 text-xs font-semibold text-brass-700 mb-6">
              <SealMark className="h-3.5 w-3.5" />
              University-verified students only
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-6xl leading-[1.08] text-ink max-w-3xl mx-auto"
          >
            Where student talent meets <em className="not-italic text-brass-700">real, paid work</em>.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg text-slate max-w-xl mx-auto"
          >
            NexusWork connects verified university students with clients who need projects done — with every
            milestone held in escrow until the work is approved.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-control bg-ink text-white text-sm font-semibold hover:bg-ink-700 transition-colors"
            >
              Browse open projects
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-control border border-ink-100 text-ink text-sm font-semibold hover:bg-ink-50 transition-colors"
            >
              Post a project
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            ["Escrow-protected", "Funds held until work is approved"],
            ["University-verified", "Every student's enrollment is confirmed"],
            ["No hidden fees", "One clear commission, shown up front"],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-xs text-slate mt-0.5">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold tracking-wide uppercase text-brass-700 mb-2">How it works</p>
          <h2 className="font-display text-3xl text-ink">From posted to paid, in four steps</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              transition={{ delay: i * 0.05 }}
              className="rounded-card border border-ink-100 bg-white p-6 shadow-card"
            >
              <span className="font-mono text-xs text-brass-700">{step.n}</span>
              <h3 className="font-display text-lg text-ink mt-2 mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-ink">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <SealMark className="h-10 w-10 text-brass mx-auto mb-6" />
          <h2 className="font-display text-3xl text-white mb-4">Ready to get started?</h2>
          <p className="text-ink-100/80 mb-8">
            Whether you're hiring or looking for work, your first move is one click away.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-control bg-brass text-ink text-sm font-semibold hover:bg-brass-300 transition-colors"
            >
              Create your account
            </Link>
            <Link
              to="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 rounded-control border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Browse projects first
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
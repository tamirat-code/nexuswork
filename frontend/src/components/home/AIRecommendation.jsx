import { BadgeCheck, FileText, Sparkles, Target } from "lucide-react";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import Reveal from "../motion/Reveal";

const points = [
  {
    icon: Target,
    title: "Project-to-student matching",
    description:
      "Recommend suitable students to clients based on required skills, project scope, and past performance.",
  },
  {
    icon: Sparkles,
    title: "Career path guidance",
    description:
      "Suggest career-relevant skills and project categories based on marketplace demand.",
  },
  {
    icon: FileText,
    title: "Resume improvement",
    description:
      "Identify missing skills, weak portfolio signals, and certification opportunities.",
  },
  {
    icon: BadgeCheck,
    title: "Verified skill weighting",
    description:
      "University-certified skills receive stronger matching confidence than self-declared skills.",
  },
];

export default function AIRecommendation() {
  return (
    <section
      id="ai-recommendation"
      className="section-padding scroll-mt-24 bg-slate-50 dark:bg-slate-900/40"
    >
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="AI Recommendation"
              title="Smarter matching between students, skills, and projects"
              description="The AI layer improves discovery beyond keyword search by understanding skills, project requirements, portfolios, and career goals."
            />

            <div className="space-y-5">
              {points.map((point, index) => {
                const Icon = point.icon;

                return (
                  <Reveal key={point.title} delay={index * 0.06}>
                    <div className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-soft text-secondary dark:bg-secondary/10 dark:text-indigo-300">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {point.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={0.3}>
              <div className="mt-8">
                <Button to="/register" variant="gradient" size="lg">
                  Try AI Matching
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.18}>
            <div className="relative">
              <div className="glass-card rounded-[2rem] p-6 shadow-glow">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    AI Match Preview
                  </h3>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                    Live Suggestion
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Analytics Dashboard Project
                      </span>
                      <span className="font-bold text-primary">94%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-primary to-accent" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        React Frontend Student
                      </span>
                      <span className="font-bold text-secondary">91%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 w-[91%] rounded-full bg-gradient-to-r from-secondary to-primary" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 font-semibold text-slate-900 dark:text-white">
                      Recommended Skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["React", "Data Visualization", "Node.js", "Communication"].map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary dark:bg-primary/10 dark:text-blue-300"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
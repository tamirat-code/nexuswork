import { BarChart3, Building2, CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import Reveal from "../motion/Reveal";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Student verification workflow",
    description:
      "University staff review student identity and enrollment evidence before students can access paid projects.",
  },
  {
    icon: GraduationCap,
    title: "Skill certification",
    description:
      "Certify academic and practical skills so students stand out with trusted credentials.",
  },
  {
    icon: BarChart3,
    title: "Employment statistics",
    description:
      "Access anonymized analytics on student income, project completion, and in-demand skills.",
  },
  {
    icon: Building2,
    title: "Internship integration",
    description:
      "Connect coursework, internships, and freelance work into one structured student development path.",
  },
];

const workflow = [
  "Student submits verification request",
  "University staff reviews evidence",
  "Verification status is approved or rejected",
  "Approved students gain marketplace access",
  "University views anonymized outcomes",
];

export default function UniversityPartnership() {
  return (
    <section
      id="university-partnership"
      className="section-padding scroll-mt-24"
    >
      <Container>
        <SectionHeading
          eyebrow="University Partnership"
          title="Universities become the trust layer of the student economy"
          description="A formal role for universities in verification, skill certification, and employment outcome tracking."
        />

        <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <Reveal key={benefit.title} delay={index * 0.06} className="h-full">
                  <article className="card-hover h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent dark:bg-accent/10 dark:text-teal-300">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>

                    <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                      {benefit.title}
                    </h3>

                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {benefit.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.16}>
            <div className="glass-card rounded-[2rem] p-8 shadow-glow">
              <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">
                Verification workflow
              </h3>

              <ol className="space-y-4">
                {workflow.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </span>

                    <span className="pt-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {item}
                    </span>

                    <CheckCircle2
                      className="ml-auto mt-1 h-5 w-5 text-success"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button to="/universities" variant="primary">
                  Partner With Us
                </Button>

                <Button href="#footer" variant="secondary">
                  Learn More
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
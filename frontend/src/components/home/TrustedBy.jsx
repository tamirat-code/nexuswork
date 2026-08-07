import Container from "../ui/Container";
import Reveal from "../motion/Reveal";
import { trustedBy } from "../../data/home";

export default function TrustedBy() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900/40">
      <Container>
        <Reveal>
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            Trusted by universities, companies, NGOs, startups, and government teams
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {trustedBy.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-soft dark:border-slate-800 dark:bg-slate-900"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
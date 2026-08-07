import { useInView } from "framer-motion";
import CountUp from "react-countup";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { stats } from "../../data/home";

function StatCard({ stat }) {
  const { ref, inView } = useInView({ once: true, amount: 0.45 });

  return (
    <div
      ref={ref}
      className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center backdrop-blur-xl"
    >
      <div className="text-3xl font-black text-white md:text-4xl">
        {inView ? (
          <CountUp
            end={stat.value}
            duration={2.2}
            prefix={stat.prefix || ""}
            suffix={stat.suffix || ""}
            decimals={stat.decimals || 0}
          />
        ) : (
          <span>
            {stat.prefix || ""}0{stat.suffix || ""}
          </span>
        )}
      </div>

      <div className="mt-2 text-sm font-medium text-blue-100">{stat.label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section id="stats" className="section-padding scroll-mt-24">
      <Container>
        <SectionHeading
          eyebrow="Platform Impact"
          title="A growing ecosystem of verified student talent"
          description="Real marketplace activity powered by university verification, secure payments, and intelligent matching."
        />

        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary via-secondary to-accent p-6 shadow-glow md:p-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
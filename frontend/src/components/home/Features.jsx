import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import FeatureCard from "../cards/FeatureCard";
import { features } from "../../data/home";

export default function Features() {
  return (
    <section id="features" className="section-padding scroll-mt-24 bg-slate-50 dark:bg-slate-900/40">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title="Everything needed for a trusted student freelance economy"
          description="From verification to payment, portfolio, analytics, and AI matching — the platform supports the full student freelance lifecycle."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
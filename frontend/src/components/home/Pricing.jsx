import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import PricingCard from "../cards/PricingCard";
import { pricingPlans } from "../../data/home";

export default function Pricing() {
  return (
    <section id="pricing" className="section-padding scroll-mt-24">
      <Container>
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing for every participant"
          description="Start free as a student, pay transparently as a client, and customize institutional plans for larger organizations."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
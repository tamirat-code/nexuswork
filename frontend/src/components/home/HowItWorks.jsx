import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Timeline from "./Timeline";
import { steps } from "../../data/home";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding scroll-mt-24">
      <Container>
        <SectionHeading
          eyebrow="How It Works"
          title="From registration to portfolio growth"
          description="A transparent, milestone-driven workflow designed for students, clients, and university partners."
        />

        <Timeline steps={steps} />
      </Container>
    </section>
  );
}
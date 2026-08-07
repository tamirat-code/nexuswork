import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import FreelancerCard from "../cards/FreelancerCard";
import { freelancers } from "../../data/home";

export default function TopFreelancers() {
  return (
    <section id="top-freelancers" className="section-padding scroll-mt-24">
      <Container>
        <SectionHeading
          eyebrow="Find Talent"
          title="Meet top verified student freelancers"
          description="Clients can hire university-verified students with proven delivery records and certified skills."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {freelancers.map((freelancer) => (
            <FreelancerCard key={freelancer.id} freelancer={freelancer} />
          ))}
        </div>
      </Container>
    </section>
  );
}
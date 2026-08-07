import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import ProjectCard from "../cards/ProjectCard";
import { projects } from "../../data/home";

export default function FeaturedProjects() {
  return (
    <section
      id="featured-projects"
      className="section-padding scroll-mt-24 bg-slate-50 dark:bg-slate-900/40"
    >
      <Container>
        <SectionHeading
          eyebrow="Featured Projects"
          title="Open opportunities from trusted clients"
          description="Students can discover projects matched to their skills, budget expectations, and availability."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </Container>
    </section>
  );
}
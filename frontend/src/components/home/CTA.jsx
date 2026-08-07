import { ArrowRight } from "lucide-react";

import Container from "../ui/Container";
import Button from "../ui/Button";
import Reveal from "../motion/Reveal";

export default function CTA() {
  return (
    <section id="cta" className="section-padding scroll-mt-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-primary via-secondary to-accent px-6 py-16 text-center shadow-glow md:px-16 md:py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              aria-hidden="true"
            >
              <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-white blur-3xl" />
              <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-white blur-3xl" />
            </div>

            <h2 className="relative mx-auto max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
              Start Your Freelance Journey Today
            </h2>

            <p className="relative mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">
              Join a trusted ecosystem where verified students build real experience,
              earn income, and grow professional portfolios.
            </p>

            <div className="relative mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                to="/register"
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:bg-blue-50"
              >
                Register Now
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <Button
                href="#featured-projects"
                variant="ghost"
                size="lg"
                className="border border-white/30 text-white hover:bg-white/10"
              >
                Explore Marketplace
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
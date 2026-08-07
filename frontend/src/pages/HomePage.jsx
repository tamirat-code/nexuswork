import Navbar from "../components/home/Navbar";
import Hero from "../components/home/Hero";
import BentoGrid from "../components/home/BentoGrid";
import TrustedBy from "../components/home/TrustedBy";
import Stats from "../components/home/Stats";
import Features from "../components/home/Features";
import HowItWorks from "../components/home/HowItWorks";
import FeaturedProjects from "../components/home/FeaturedProjects";
import TopFreelancers from "../components/home/TopFreelancers";
import AIRecommendation from "../components/home/AIRecommendation";
import UniversityPartnership from "../components/home/UniversityPartnership";
import Testimonials from "../components/home/Testimonials";
import Pricing from "../components/home/Pricing";
import FAQ from "../components/home/FAQ";
import CTA from "../components/home/CTA";
import Newsletter from "../components/home/Newsletter";
import Footer from "../components/home/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="top">
        <Hero />
        <BentoGrid />
        <TrustedBy />
        <Stats />
        <Features />
        <HowItWorks />
        <FeaturedProjects />
        <TopFreelancers />
        <AIRecommendation />
        <UniversityPartnership />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
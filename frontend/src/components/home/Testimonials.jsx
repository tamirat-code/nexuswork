import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, A11y } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import TestimonialCard from "../cards/TestimonialCard";
import { testimonials } from "../../data/home";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="section-padding scroll-mt-24 bg-slate-50 dark:bg-slate-900/40"
    >
      <Container>
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by students, clients, and universities"
          description="Real experiences from the marketplace community."
        />

        <Swiper
          modules={[Autoplay, Pagination, A11y]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          a11y={{
            prevSlideMessage: "Previous testimonial",
            nextSlideMessage: "Next testimonial",
          }}
          breakpoints={{
            768: {
              slidesPerView: 2,
            },
            1280: {
              slidesPerView: 3,
            },
          }}
          className="!pb-14"
        >
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial.name} className="!h-auto">
              <TestimonialCard testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}
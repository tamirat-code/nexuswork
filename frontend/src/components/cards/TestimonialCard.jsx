import { Quote } from "lucide-react";

export default function TestimonialCard({ testimonial }) {
  return (
    <figure className="h-full rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <Quote className="mb-4 h-8 w-8 text-primary/30" aria-hidden="true" />

      <blockquote className="text-base leading-7 text-slate-700 dark:text-slate-200">
        “{testimonial.quote}”
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-white"
          aria-hidden="true"
        >
          {testimonial.initials}
        </div>

        <div>
          <div className="font-bold text-slate-900 dark:text-white">
            {testimonial.name}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {testimonial.role}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
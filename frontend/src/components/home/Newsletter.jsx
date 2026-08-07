import { useForm } from "react-hook-form";
import {  CheckCircle2, Loader2, Mail } from "lucide-react";

import Container from "../ui/Container";
import Button from "../ui/Button";
import Reveal from "../motion/Reveal";
import api from "../../lib/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Newsletter() {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      if (!import.meta.env.VITE_API_URL) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      } else {
        await api.post("/newsletter/subscriptions", { email });
      }

      reset();
      alert(t("newsletter.success"));
    } catch {
      alert(t("newsletter.error"));
    }
  };

  return (
    <section id="newsletter" className="section-padding scroll-mt-24">
      <Container className="max-w-4xl">
        <Reveal>
          <div className="glass-card rounded-[2.5rem] p-8 text-center shadow-card md:p-12">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary dark:bg-primary/10 dark:text-blue-300">
              <Mail className="h-7 w-7" aria-hidden="true" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white md:text-3xl">
              {t("newsletter.title")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
              {t("newsletter.subtitle")}
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <label className="w-full" htmlFor="newsletter-email">
                <span className="sr-only">Email address</span>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder={t("newsletter.placeholder")}
                  autoComplete="email"
                  {...register("email", {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  })}
                  className="h-13 w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={isSubmitting}
                className="shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : null}
                {t("newsletter.button")}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              No spam. Unsubscribe anytime.
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
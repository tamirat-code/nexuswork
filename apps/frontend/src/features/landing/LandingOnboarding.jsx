import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { cn } from "../../lib/cn.js";

const STORAGE_KEY = "nexuswork:guest-onboarding:v1";

function hasCompletedGuide() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "complete";
  } catch {
    return false;
  }
}

export default function LandingOnboarding({ enabled = true }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const touchStart = useRef(null);

  const slides = [
    {
      eyebrow: t("landing.onboarding.slide1.eyebrow"),
      title: t("landing.onboarding.slide1.title"),
      body: t("landing.onboarding.slide1.body"),
      icon: Sparkles,
      tone: "from-teal-400/20 via-cyan-400/10 to-transparent",
      points: [t("landing.onboarding.slide1.point1"), t("landing.onboarding.slide1.point2"), t("landing.onboarding.slide1.point3")],
    },
    {
      eyebrow: t("landing.onboarding.slide2.eyebrow"),
      title: t("landing.onboarding.slide2.title"),
      body: t("landing.onboarding.slide2.body"),
      icon: BriefcaseBusiness,
      tone: "from-brass/20 via-amber-400/10 to-transparent",
      choices: [
        { icon: BriefcaseBusiness, title: t("landing.onboarding.slide2.choice1Title"), body: t("landing.onboarding.slide2.choice1Body"), to: "/register" },
        { icon: GraduationCap, title: t("landing.onboarding.slide2.choice2Title"), body: t("landing.onboarding.slide2.choice2Body"), to: "/register" },
      ],
    },
    {
      eyebrow: t("landing.onboarding.slide3.eyebrow"),
      title: t("landing.onboarding.slide3.title"),
      body: t("landing.onboarding.slide3.body"),
      icon: FileCheck2,
      tone: "from-blue-400/20 via-indigo-400/10 to-transparent",
      flow: [t("landing.onboarding.slide3.flow1"), t("landing.onboarding.slide3.flow2"), t("landing.onboarding.slide3.flow3"), t("landing.onboarding.slide3.flow4")],
    },
    {
      eyebrow: t("landing.onboarding.slide4.eyebrow"),
      title: t("landing.onboarding.slide4.title"),
      body: t("landing.onboarding.slide4.body"),
      icon: ShieldCheck,
      tone: "from-emerald-400/20 via-teal-400/10 to-transparent",
      points: [t("landing.onboarding.slide4.point1"), t("landing.onboarding.slide4.point2"), t("landing.onboarding.slide4.point3")],
    },
  ];

  const current = slides[slide];
  const Icon = current.icon;

  useEffect(() => {
    if (!enabled || hasCompletedGuide()) return;
    setOpen(true);
  }, [enabled]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, slide]);

  function finish() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "complete");
    } catch {
      // The guide can still be dismissed when storage is unavailable.
    }
    setOpen(false);
  }

  function next() {
    if (slide === slides.length - 1) finish();
    else setSlide((value) => value + 1);
  }

  function previous() {
    setSlide((value) => Math.max(0, value - 1));
  }

  function handleTouchStart(event) {
    touchStart.current = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) distance < 0 ? next() : previous();
    touchStart.current = null;
  }

  if (!open) return null;

  return createPortal((
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/75 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="guest-onboarding-title">
      <div className="relative max-h-[min(760px,100dvh)] w-full max-w-4xl overflow-y-auto rounded-t-[28px] border border-ink-300 bg-ink-700 shadow-[0_28px_100px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
        <button type="button" onClick={finish} aria-label={t("landing.onboarding.closeGuide")} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-ink-300 bg-ink-700/80 text-slate-300 transition-colors hover:bg-ink-50 hover:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass">
          <X className="h-5 w-5" />
        </button>

        <div className="grid min-h-[590px] md:grid-cols-[0.9fr_1.1fr]">
          <div className={cn("relative hidden overflow-hidden bg-gradient-to-br p-10 md:flex md:flex-col md:justify-between", current.tone)}>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-white/10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-bold text-slate"><img src="/logo.svg" alt="" className="h-9 w-9" /> NexusWork</div>
              <p className="mt-20 max-w-xs font-display text-3xl font-extrabold leading-tight tracking-tight text-white">{t("landing.onboarding.guidedPath")}</p>
            </div>
            <div className="relative flex items-center gap-2 text-xs font-semibold text-slate-300"><span className="h-2 w-2 rounded-full bg-brass" /> {t("landing.onboarding.forBoth")}</div>
          </div>

          <div className="flex min-h-[590px] flex-col p-6 sm:p-10" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex items-center justify-between pr-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brass">{t("landing.onboarding.gettingStarted")} · {String(slide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</p>
              <button type="button" onClick={finish} className="text-xs font-semibold text-slate-300 underline-offset-4 hover:text-brass hover:underline">{t("landing.onboarding.skip")}</button>
            </div>

            <motion.div key={slide} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex flex-1 flex-col justify-center py-10">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-brass/30 bg-brass/10 text-brass shadow-[0_10px_30px_rgba(0,137,123,0.12)]"><Icon className="h-8 w-8" /></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-brand-dark">{current.eyebrow}</p>
              <h2 id="guest-onboarding-title" className="mt-3 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight text-slate sm:text-4xl">{current.title}</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">{current.body}</p>

              {current.points && <div className="mt-8 space-y-3">{current.points.map((point) => <div key={point} className="flex items-center gap-3 text-sm font-semibold text-slate"><span className="grid h-6 w-6 place-items-center rounded-full bg-escrow/15 text-escrow"><Check className="h-3.5 w-3.5" /></span>{point}</div>)}</div>}
              {current.choices && <div className="mt-8 grid gap-3 sm:grid-cols-2">{current.choices.map(({ icon: ChoiceIcon, title, body, to }) => <Link key={title} to={to} onClick={finish} className="group rounded-2xl border border-ink-300 bg-ink-50 p-4 transition-all hover:-translate-y-0.5 hover:border-brass/50 hover:bg-ink-700"><ChoiceIcon className="h-5 w-5 text-brass" /><p className="mt-4 font-display font-bold text-slate">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-300">{body}</p><ArrowRight className="mt-4 h-4 w-4 text-brass transition-transform group-hover:translate-x-1" /></Link>)}</div>}
              {current.flow && <div className="mt-8 flex flex-wrap items-center gap-2">{current.flow.map((item, index) => <div key={item} className="flex items-center gap-2"><span className="rounded-full border border-ink-300 bg-ink-50 px-3 py-2 text-xs font-bold text-slate">{item}</span>{index < current.flow.length - 1 && <ArrowRight className="h-4 w-4 text-brass" />}</div>)}</div>}
            </motion.div>

            <div className="flex items-center justify-between gap-4 border-t border-ink-300 pt-5">
              <div className="flex items-center gap-2" role="tablist" aria-label="Guide slides">{slides.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={slide === index} aria-label={`Go to slide ${index + 1}`} onClick={() => setSlide(index)} className={cn("h-2 rounded-full transition-all", slide === index ? "w-8 bg-brass" : "w-2 bg-ink-300 hover:bg-slate-300")} />)}</div>
              <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={previous} disabled={slide === 0}><ChevronLeft className="h-4 w-4" /> {t("landing.onboarding.back")}</Button><Button size="sm" onClick={next}>{slide === slides.length - 1 ? t("landing.onboarding.getStarted") : t("landing.onboarding.next")}<ArrowRight className="h-4 w-4" /></Button></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

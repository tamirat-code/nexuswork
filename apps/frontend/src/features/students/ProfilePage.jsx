import { useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Globe,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { getStudentProfile } from "../../services/api/students.api.js";
import { getUserReputation } from "../../services/api/reviews.api.js";
import { getUserPortfolio } from "../../services/api/portfolios.api.js";
import { ROLES } from "../../constants/roles.constants.js";
import { formatDate } from "../../utils/date.utils.js";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import ReviewsSection from "../reviews/ReviewsSection.jsx";

const ENROLLMENT_LABELS = {
  enrolled: "Currently enrolled",
  graduated: "Graduated",
  on_leave: "On leave",
  unknown: "Enrollment status unknown",
};

function initialsOf(name) {
  return (name || "S")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const isOwnProfile = !!user && String(user.id) === String(id);

  const profileQuery = useQuery({
    queryKey: ["student-profile", id],
    queryFn: () => getStudentProfile(id),
    enabled: !!id,
    retry: false,
  });

  const reputationQuery = useQuery({
    queryKey: ["reputation", id],
    queryFn: () => getUserReputation(id),
    enabled: !!id,
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolio", id],
    queryFn: () => getUserPortfolio(id),
    enabled: !!id,
  });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    const notFound = profileQuery.error?.status === 404;
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center text-slate">
        <h1 className="font-display text-2xl">
          {notFound ? t("studentProfile.notFound", { defaultValue: "Student not found" }) : t("studentProfile.loadError", { defaultValue: "We couldn't load this profile" })}
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          {notFound
            ? t("studentProfile.notFoundHint", { defaultValue: "This profile doesn't exist, or the student is no longer active." })
            : profileQuery.error?.message || t("studentProfile.genericError", { defaultValue: "Something went wrong. Please try again." })}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {!notFound && (
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-slate-300 hover:border-brass hover:text-brass"
            >
              {t("common.tryAgain", { defaultValue: "Try again" })}
            </button>
          )}
          <Link
            to="/students"
            className="rounded-lg bg-brass px-4 py-2 text-sm font-semibold text-ink hover:opacity-90"
          >
            {t("studentProfile.backToDirectory", { defaultValue: "Back to directory" })}
          </Link>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data?.data;
  const reputation = reputationQuery.data?.data;
  const portfolio = portfolioQuery.data?.data ?? [];

  const initials = initialsOf(profile.name);
  const reviewCount = reputation?.review_count ?? 0;
  const avgRating = reputation?.average_rating;

  const tabs = [
    { id: "overview", label: t("studentProfile.overview", { defaultValue: "Overview" }) },
    { id: "portfolio", label: t("studentProfile.portfolioCount", { count: portfolio.length, defaultValue: `Portfolio (${portfolio.length})` }) },
    { id: "reviews", label: t("studentProfile.reviewsCount", { count: reviewCount, defaultValue: `Reviews (${reviewCount})` }) },
  ];

  return (
    <div className="min-h-screen bg-ink text-slate">
      {/* =========================================================
          PROFILE HEADER
      ========================================================= */}
      <section className="border-b border-ink-300">
        <div className="mx-auto max-w-7xl px-6 pb-0 pt-8">
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link to="/students" className="transition hover:text-brass">
              {t("studentProfile.students", { defaultValue: "Students" })}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-400">{profile.name}</span>
          </div>

          <div className="relative overflow-hidden rounded-t-3xl border border-ink-300 bg-ink-50">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-brass/10 via-transparent to-brass/5" />

            <div className="relative px-6 pb-8 pt-8 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                  <div className="relative shrink-0">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-32 w-32 rounded-3xl border-4 border-ink-50 object-cover shadow-xl"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-ink-50 bg-brass/15 text-3xl font-bold text-brass shadow-xl">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        {profile.name}
                      </h1>
                      {profile.universityVerified && (
                        <BadgeCheck className="h-6 w-6 text-cyan-400" aria-label="University verified" />
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {profile.headline || (profile.program ? `${profile.program} student` : "Student")}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      {profile.university && (
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-brass" />
                          {profile.university}
                        </span>
                      )}
                      {profile.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-brass" />
                          {profile.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isOwnProfile ? (
                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-2 rounded-lg border border-ink-300 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-brass hover:text-brass"
                    >
                      {t("studentProfile.editProfile", { defaultValue: "Edit profile" })}
                    </Link>
                  ) : (
                    user?.role === ROLES.CLIENT && (
                      <Link
                        to="/projects/new"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
                      >
                        {t("projects.post", { defaultValue: "Post a project" })}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 divide-x divide-ink-300 border-t border-ink-300 pt-6 sm:grid-cols-3">
                <div className="px-4 first:pl-0">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-brass" />
                    <span className="text-lg font-semibold">
                      {avgRating != null ? avgRating.toFixed(1) : "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t("studentProfile.reviewCount", { count: reviewCount, defaultValue: `${reviewCount} reviews` })}</p>
                </div>

                <div className="px-4">
                  <p className="text-lg font-semibold">{portfolio.length}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("studentProfile.portfolioItems", { defaultValue: "Portfolio items" })}</p>
                </div>

                <div className="border-t border-ink-300 px-4 pt-4 sm:border-t-0 sm:pt-0">
                  <p className="text-lg font-semibold">{profile.completedContracts ?? 0}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("studentProfile.completedContracts", { defaultValue: "Completed contracts" })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-7 overflow-x-auto border-b border-ink-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap py-4 text-sm font-medium transition ${
                  activeTab === tab.id ? "text-brass" : "text-slate-500 hover:text-slate"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brass" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PROFILE CONTENT
      ========================================================= */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-7">
            {activeTab === "overview" && (
              <>
                {profile.bio && (
                  <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/10">
                        <UserRound className="h-4 w-4 text-brass" />
                      </div>
                      <h2 className="font-display text-xl font-semibold">{t("studentProfile.aboutMe", { defaultValue: "About me" })}</h2>
                    </div>
                    <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300">{profile.bio}</p>
                  </section>
                )}

                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">{t("studentProfile.expertise", { defaultValue: "Expertise" })}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{t("studentProfile.skillsExpertise", { defaultValue: "Skills & expertise" })}</h2>

                  {profile.skills?.length > 0 ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {profile.skills.map((skill, i) => (
                        <span
                          key={`${skill.name}-${i}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-ink px-3 py-1.5 text-xs text-slate-300"
                        >
                          {skill.name}
                          {skill.level && <span className="text-slate-500">· {skill.level}</span>}
                          {skill.verification_method && skill.verification_method !== "self_declared" && (
                            <span className="inline-flex items-center gap-1 text-cyan-400" title={skill.verification_method === "university_certified" ? "University certified" : "Assessment evidence provided"}>
                              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="text-[10px] font-semibold uppercase">{skill.verification_method === "university_certified" ? "University certified" : "Assessed"}</span>
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">{t("studentProfile.noSkills", { defaultValue: "No skills listed yet." })}</p>
                  )}
                </section>

                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/10">
                      <GraduationCap className="h-4 w-4 text-brass" />
                    </div>
                    <h2 className="font-display text-xl font-semibold">{t("studentProfile.education", { defaultValue: "Education" })}</h2>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-300 bg-ink">
                      <GraduationCap className="h-4 w-4 text-brass" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate">
                        {profile.program || "Program not listed"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">{profile.university || "University not listed"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ENROLLMENT_LABELS[profile.enrollment_status] || ENROLLMENT_LABELS.unknown}
                      </p>
                    </div>
                  </div>
                </section>

                {portfolio.length > 0 && (
                  <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">Experience</p>
                        <h2 className="mt-1 font-display text-xl font-semibold">Recent work</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("portfolio")}
                        className="text-xs font-semibold text-brass hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    <div className="mt-6 space-y-3">
                      {portfolio.slice(0, 2).map((item) => (
                        <PortfolioRow key={item._id} item={item} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === "portfolio" && (
              <section>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">Work showcase</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">Portfolio</h2>
                  <p className="mt-2 text-sm text-slate-500">Projects and work completed through NexusWork.</p>
                </div>

                {portfolio.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-12 text-center">
                    <p className="text-sm text-slate-400">No published portfolio items yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {portfolio.map((item) => (
                      <PortfolioCard key={item._id} item={item} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === "reviews" && <ReviewsSection userId={id} showForm={false} />}
          </div>

          {/* =====================================================
              SIDEBAR
          ===================================================== */}
          <aside className="space-y-5">
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                  <BadgeCheck className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    {profile.universityVerified ? "University verified" : "Verification pending"}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {profile.universityVerified
                      ? "This student's identity has been verified through their university."
                      : "This student's university identity has not been verified yet."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6">
              <h3 className="font-display text-lg font-semibold">Details</h3>
              <div className="mt-5 space-y-4">
                {profile.university && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 text-brass" />
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">{t("studentProfile.university", { defaultValue: "University" })}</p>
                      <p className="mt-1 text-xs text-slate-300">{profile.university}</p>
                    </div>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 text-brass" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">{t("studentProfile.website", { defaultValue: "Website" })}</p>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-xs text-brass hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}
                {profile.memberSince && (
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-brass" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">{t("studentProfile.memberSince", { defaultValue: "Member since" })}</p>
                      <p className="mt-1 text-xs text-slate-300">{formatDate(profile.memberSince)}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PortfolioRow({ item }) {
  return (
    <div className="group rounded-xl border border-ink-300 bg-ink p-5 transition hover:border-brass/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{item.title}</h3>
          {item.description && (
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
            {item.tags?.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
        {item.project_url && (
          <a href={item.project_url} target="_blank" rel="noreferrer" className="shrink-0">
            <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-brass" />
          </a>
        )}
      </div>
    </div>
  );
}

function PortfolioCard({ item }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-ink-300 bg-ink-50 transition hover:-translate-y-1 hover:border-brass/30">
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brass/10 via-ink to-ink">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <BriefcaseBusiness className="h-10 w-10 text-brass/60" />
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">{item.title}</h3>
          {item.project_url && (
            <a href={item.project_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-600 hover:text-brass" />
            </a>
          )}
        </div>
        {item.description && (
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {item.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-ink-300 px-2.5 py-1 text-[10px] text-slate-400">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

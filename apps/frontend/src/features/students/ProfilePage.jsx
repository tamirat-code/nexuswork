import { useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  /*
   * Temporary profile data.
   *
   * This is UI data for now.
   * We will connect these fields to the real backend
   * once we wire the student profile API.
   */

  const profile = {
    name:
      user?.name ||
      user?.fullName ||
      user?.email?.split("@")[0] ||
      "Student",

    email: user?.email || "student@nexuswork.com",

    university:
      user?.university ||
      user?.university_name ||
      "University of Gondar",

    department:
      user?.department ||
      user?.department_name ||
      "Computer Science",

    location: "Ethiopia",

    bio:
      "Computer Science student passionate about building useful digital products, solving technical problems, and gaining real-world experience through meaningful projects.",

    availability: "Available for work",

    rating: 4.9,

    reviewCount: 12,

    completedProjects: 8,

    responseTime: "Within a few hours",

    memberSince: "August 2026",

    verified: true,

    profileCompletion: 82,

    skills: [
      {
        name: "React",
        level: "Advanced",
        percentage: 90,
      },
      {
        name: "JavaScript",
        level: "Advanced",
        percentage: 88,
      },
      {
        name: "Node.js",
        level: "Intermediate",
        percentage: 75,
      },
      {
        name: "MongoDB",
        level: "Intermediate",
        percentage: 72,
      },
      {
        name: "UI/UX",
        level: "Intermediate",
        percentage: 68,
      },
      {
        name: "Git",
        level: "Advanced",
        percentage: 85,
      },
    ],

    projects: [
      {
        title: "Campus Marketplace",
        description:
          "A student-focused marketplace built with React and Node.js.",
        category: "Web Development",
        year: "2026",
        status: "Completed",
      },
      {
        title: "University Management System",
        description:
          "A full-stack system for managing university students and departments.",
        category: "Software Development",
        year: "2026",
        status: "Completed",
      },
      {
        title: "Student Dashboard",
        description:
          "A responsive dashboard interface designed for university students.",
        category: "UI/UX",
        year: "2026",
        status: "Completed",
      },
    ],

    education: [
      {
        degree: "Bachelor of Science",
        field: "Computer Science",
        university: "University of Gondar",
        period: "2022 — Present",
      },
    ],

    reviews: [
      {
        name: "Client",
        rating: 5,
        text:
          "Excellent communication and very good technical understanding. The project was delivered professionally.",
        project: "Web Application",
        date: "2 weeks ago",
      },
      {
        name: "Client",
        rating: 5,
        text:
          "Very responsive and easy to work with. I would definitely recommend this student for future projects.",
        project: "Database Project",
        date: "1 month ago",
      },
    ],
  };

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileImage =
    user?.avatar ||
    user?.avatarUrl ||
    user?.profileImage ||
    user?.profile_image ||
    null;

  const tabs = [
    {
      id: "overview",
      label: "Overview",
    },
    {
      id: "portfolio",
      label: "Portfolio",
    },
    {
      id: "reviews",
      label: `Reviews (${profile.reviewCount})`,
    },
  ];

  return (
    <div className="min-h-screen bg-ink text-slate">
      {/* =========================================================
          PROFILE HEADER
      ========================================================= */}

      <section className="border-b border-ink-300">
        <div className="mx-auto max-w-7xl px-6 pb-0 pt-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
            <Link
              to="/students"
              className="transition hover:text-brass"
            >
              Students
            </Link>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="text-slate-400">
              {profile.name}
            </span>
          </div>

          {/* Main profile card */}
          <div className="relative overflow-hidden rounded-t-3xl border border-ink-300 bg-ink-50">
            {/* Decorative background */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-brass/10 via-transparent to-brass/5" />

            <div className="relative px-6 pb-8 pt-8 sm:px-8 lg:px-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                {/* Identity */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profile.name}
                        className="h-32 w-32 rounded-3xl border-4 border-ink-50 object-cover shadow-xl"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-ink-50 bg-brass/15 text-3xl font-bold text-brass shadow-xl">
                        {initials}
                      </div>
                    )}

                    {/* Availability indicator */}
                    <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-4 border-ink-50 bg-emerald-400">
                      <span className="sr-only">
                        Available
                      </span>
                    </span>
                  </div>

                  {/* Identity information */}
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        {profile.name}
                      </h1>

                      {profile.verified && (
                        <BadgeCheck className="h-6 w-6 text-cyan-400" />
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {profile.department} student
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4 text-brass" />
                        {profile.university}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-brass" />
                        {profile.location}
                      </span>

                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {profile.availability}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                
 <Link
 to="/profile/edit"
 className="inline-flex items-center gap-2 rounded-lg border border-ink-300 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-brass hover:text-brass"
>
 Edit profile
</Link>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact me
                  </button>

                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-300 bg-ink text-slate-400 transition hover:text-slate"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 divide-x divide-ink-300 border-t border-ink-300 pt-6 sm:grid-cols-4">
                {/* Rating */}
                <div className="px-4 first:pl-0">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-brass" />

                    <span className="text-lg font-semibold">
                      {profile.rating}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {profile.reviewCount} reviews
                  </p>
                </div>

                {/* Projects */}
                <div className="px-4">
                  <p className="text-lg font-semibold">
                    {profile.completedProjects}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Completed projects
                  </p>
                </div>

                {/* Response time */}
                <div className="border-t border-ink-300 px-4 pt-4 sm:border-t-0 sm:pt-0">
                  <p className="text-lg font-semibold">
                    {profile.responseTime}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Response time
                  </p>
                </div>

                {/* Member since */}
                <div className="border-t border-ink-300 px-4 pt-4 sm:border-t-0 sm:pt-0">
                  <p className="text-lg font-semibold">
                    {profile.memberSince}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Member since
                  </p>
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
                  activeTab === tab.id
                    ? "text-brass"
                    : "text-slate-500 hover:text-slate"
                }`}
              >
                {tab.label}

                {activeTab === tab.id && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brass" />
                )}
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
          {/* =====================================================
              MAIN COLUMN
          ===================================================== */}

          <div className="space-y-7">
            {/* ===================================================
                OVERVIEW
            =================================================== */}

            {activeTab === "overview" && (
              <>
                {/* About */}
                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/10">
                      <UserRound className="h-4 w-4 text-brass" />
                    </div>

                    <h2 className="font-display text-xl font-semibold">
                      About me
                    </h2>
                  </div>

                  <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300">
                    {profile.bio}
                  </p>
                </section>

                {/* Skills */}
                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                        Expertise
                      </p>

                      <h2 className="mt-1 font-display text-xl font-semibold">
                        Skills & expertise
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-300 text-slate-500 transition hover:text-brass"
                      aria-label="Add skill"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    {profile.skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">
                            {skill.name}
                          </span>

                          <span className="text-[11px] text-slate-500">
                            {skill.level}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-ink">
                          <div
                            className="h-full rounded-full bg-brass"
                            style={{
                              width: `${skill.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Education */}
                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass/10">
                      <GraduationCap className="h-4 w-4 text-brass" />
                    </div>

                    <h2 className="font-display text-xl font-semibold">
                      Education
                    </h2>
                  </div>

                  <div className="mt-6 space-y-5">
                    {profile.education.map((education) => (
                      <div
                        key={`${education.university}-${education.field}`}
                        className="flex gap-4"
                      >
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-300 bg-ink">
                          <GraduationCap className="h-4 w-4 text-brass" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate">
                            {education.degree}
                          </h3>

                          <p className="mt-1 text-sm text-slate-300">
                            {education.field}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {education.university} · {education.period}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Recent work */}
                <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                        Experience
                      </p>

                      <h2 className="mt-1 font-display text-xl font-semibold">
                        Recent work
                      </h2>
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
                    {profile.projects.slice(0, 2).map((project) => (
                      <div
                        key={project.title}
                        className="group rounded-xl border border-ink-300 bg-ink p-5 transition hover:border-brass/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {project.title}
                              </h3>

                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {project.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
                              <span>{project.category}</span>

                              <span>·</span>

                              <span>{project.year}</span>
                            </div>
                          </div>

                          <ExternalLink className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-brass" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ===================================================
                PORTFOLIO
            =================================================== */}

            {activeTab === "portfolio" && (
              <section>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                    Work showcase
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-semibold">
                    Portfolio
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Projects and work completed through NexusWork.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {profile.projects.map((project) => (
                    <article
                      key={project.title}
                      className="group overflow-hidden rounded-2xl border border-ink-300 bg-ink-50 transition hover:-translate-y-1 hover:border-brass/30"
                    >
                      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brass/10 via-ink to-ink">
                        <BriefcaseBusiness className="h-10 w-10 text-brass/60" />
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-lg font-semibold">
                            {project.title}
                          </h3>

                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {project.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-full border border-ink-300 px-2.5 py-1 text-[10px] text-slate-400">
                            {project.category}
                          </span>

                          <span className="text-xs text-slate-500">
                            {project.year}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* ===================================================
                REVIEWS
            =================================================== */}

            {activeTab === "reviews" && (
              <section>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                    Client feedback
                  </p>

                  <h2 className="mt-1 font-display text-2xl font-semibold">
                    Reviews
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Feedback from clients who have worked with this
                    student.
                  </p>
                </div>

                <div className="space-y-4">
                  {profile.reviews.map((review, index) => (
                    <article
                      key={`${review.project}-${index}`}
                      className="rounded-2xl border border-ink-300 bg-ink-50 p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {review.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {review.project}
                          </p>
                        </div>

                        <div className="flex gap-0.5">
                          {Array.from({
                            length: review.rating,
                          }).map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className="h-3.5 w-3.5 fill-current text-brass"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-5 text-sm leading-7 text-slate-300">
                        "{review.text}"
                      </p>

                      <p className="mt-4 text-[11px] text-slate-500">
                        {review.date}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* =====================================================
              SIDEBAR
          ===================================================== */}

          <aside className="space-y-5">
            {/* Profile completion */}
            <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Profile completion
                </h3>

                <span className="text-sm font-semibold text-brass">
                  {profile.profileCompletion}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink">
                <div
                  className="h-full rounded-full bg-brass"
                  style={{
                    width: `${profile.profileCompletion}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Complete your profile to increase your chances of
                being matched with the right projects.
              </p>

              <button
                type="button"
                className="mt-4 text-xs font-semibold text-brass hover:underline"
              >
                Complete profile →
              </button>
            </section>

            {/* University verification */}
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                  <BadgeCheck className="h-5 w-5 text-cyan-400" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    University verified
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your student identity has been verified through
                    your university.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-cyan-400/10 pt-4 text-xs text-cyan-300">
                <CheckCircle2 className="h-4 w-4" />
                Verified student
              </div>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border border-ink-300 bg-ink-50 p-6">
              <h3 className="font-display text-lg font-semibold">
                Contact
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-brass" />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Email
                    </p>

                    <p className="mt-1 break-all text-xs text-slate-300">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-brass" />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Availability
                    </p>

                    <p className="mt-1 text-xs text-emerald-400">
                      {profile.availability}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-brass" />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Member since
                    </p>

                    <p className="mt-1 text-xs text-slate-300">
                      {profile.memberSince}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Work together */}
            <section className="rounded-2xl border border-brass/20 bg-gradient-to-br from-brass/10 to-transparent p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                Work together
              </p>

              <h3 className="mt-2 font-display text-xl font-semibold">
                Have a project in mind?
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Start a conversation and see if this student is a good
                fit for your project.
              </p>

              <button
                type="button"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brass px-4 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" />
                Start a conversation
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}